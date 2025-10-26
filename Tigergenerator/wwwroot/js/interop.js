export function loadImage(path) {
    return new Promise((resolve, error) => {
        const image = new Image();
        image.id = path;
        image.onload = () => {
            const image2 = document.getElementById(path);
            resolve(image2);
        };
        image.onerror = (err) => {
            error(err);
        };
        image.src = path;
        image.hidden = true;
        document.body.append(image);
    });
}
export function scrollToTop() {
    window.scrollTo(0, 0);
}
export function scrollToBottom() {
    const elmnt = document.getElementById("attributesHeader");
    elmnt.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
}
export function downloadCanvasAsImage(elementId) {
    const canvas = document.getElementById(elementId);
    if (!canvas) {
        return;
    }
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "tiger.png";
    anchor.click();
}
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 625;
const MASK_BOUNDS = { left: 128, top: 164, right: 279, bottom: 298 };
const MASK_CENTER_X = (MASK_BOUNDS.left + MASK_BOUNDS.right) / 2;
const MASK_CENTER_Y = (MASK_BOUNDS.top + MASK_BOUNDS.bottom) / 2;
const dragStates = new WeakMap();
const customFaceImages = new Map();
let maskImagePromise = null;
let customFaceCanvas = null;
let customFaceContext = null;
function createImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}
function whenImageReady(image) {
    if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve(image);
    }
    return new Promise((resolve) => {
        image.addEventListener("load", () => resolve(image), { once: true });
    });
}
function updateScale(state) {
    const rect = state.stage.getBoundingClientRect();
    state.scaleX = rect.width === 0 ? 1 : rect.width / CANVAS_WIDTH;
    state.scaleY = rect.height === 0 ? 1 : rect.height / CANVAS_HEIGHT;
}
function applyTransform(state) {
    if (state.image.naturalWidth === 0 || state.image.naturalHeight === 0) {
        return;
    }
    updateScale(state);
    state.image.style.width = `${state.image.naturalWidth * state.scaleX}px`;
    state.image.style.height = `${state.image.naturalHeight * state.scaleY}px`;
    state.image.style.transform = `translate(${state.offsetX * state.scaleX}px, ${state.offsetY * state.scaleY}px)`;
}
function notify(state) {
    state.dotNetRef?.invokeMethodAsync("UpdateCustomFacePosition", state.offsetX, state.offsetY);
}
function centerState(state) {
    if (state.image.naturalWidth === 0 || state.image.naturalHeight === 0) {
        return;
    }
    state.offsetX = MASK_CENTER_X - state.image.naturalWidth / 2;
    state.offsetY = MASK_CENTER_Y - state.image.naturalHeight / 2;
    applyTransform(state);
    notify(state);
}
function ensureCustomFaceCanvas(width, height) {
    if (!customFaceCanvas || !customFaceContext || customFaceCanvas.width !== width || customFaceCanvas.height !== height) {
        customFaceCanvas = document.createElement("canvas");
        customFaceCanvas.width = width;
        customFaceCanvas.height = height;
        customFaceContext = customFaceCanvas.getContext("2d");
    }
    return customFaceContext;
}
function getMaskImage() {
    if (!maskImagePromise) {
        maskImagePromise = createImage("img/ansikten/ansikte-mask.png");
    }
    return maskImagePromise;
}
function getCustomFaceImage(dataUrl) {
    if (!customFaceImages.has(dataUrl)) {
        customFaceImages.set(dataUrl, createImage(dataUrl));
    }
    return customFaceImages.get(dataUrl);
}
function attachDragHandlers(state) {
    const { image } = state;
    const pointerDownHandler = (event) => {
        event.preventDefault();
        state.pointerId = event.pointerId;
        state.startX = event.clientX;
        state.startY = event.clientY;
        state.initialOffsetX = state.offsetX;
        state.initialOffsetY = state.offsetY;
        updateScale(state);
        image.setPointerCapture(event.pointerId);
        image.classList.add("dragging");
    };
    const pointerMoveHandler = (event) => {
        if (state.pointerId !== event.pointerId) {
            return;
        }
        event.preventDefault();
        updateScale(state);
        const deltaX = (event.clientX - state.startX) / state.scaleX;
        const deltaY = (event.clientY - state.startY) / state.scaleY;
        state.offsetX = state.initialOffsetX + deltaX;
        state.offsetY = state.initialOffsetY + deltaY;
        applyTransform(state);
        notify(state);
    };
    const pointerUpHandler = (event) => {
        if (state.pointerId !== event.pointerId) {
            return;
        }
        event.preventDefault();
        image.releasePointerCapture(event.pointerId);
        state.pointerId = undefined;
        image.classList.remove("dragging");
        notify(state);
    };
    state.pointerDownHandler = pointerDownHandler;
    state.pointerMoveHandler = pointerMoveHandler;
    state.pointerUpHandler = pointerUpHandler;
    image.addEventListener("pointerdown", pointerDownHandler);
    image.addEventListener("pointermove", pointerMoveHandler);
    image.addEventListener("pointerup", pointerUpHandler);
    image.addEventListener("pointercancel", pointerUpHandler);
    image.addEventListener("lostpointercapture", pointerUpHandler);
    const resizeObserver = new ResizeObserver(() => applyTransform(state));
    resizeObserver.observe(state.stage);
    state.resizeObserver = resizeObserver;
}
function ensureState(imageElement, dotNetRef, stage) {
    let state = dragStates.get(imageElement);
    if (!state) {
        state = {
            image: imageElement,
            stage,
            dotNetRef,
            offsetX: 0,
            offsetY: 0,
            scaleX: 1,
            scaleY: 1,
            startX: 0,
            startY: 0,
            initialOffsetX: 0,
            initialOffsetY: 0,
            pointerDownHandler: () => undefined,
            pointerMoveHandler: () => undefined,
            pointerUpHandler: () => undefined,
            resizeObserver: new ResizeObserver(() => undefined)
        };
        attachDragHandlers(state);
        dragStates.set(imageElement, state);
    }
    state.stage = stage;
    state.dotNetRef = dotNetRef;
    return state;
}
export function initializeCustomFaceDrag(imageElement, dotNetRef, offsetX, offsetY, autoCenter) {
    if (!imageElement) {
        return;
    }
    const stage = imageElement.closest(".custom-face-stage");
    if (!stage) {
        return;
    }
    const state = ensureState(imageElement, dotNetRef, stage);
    const shouldAutoCenter = autoCenter || !Number.isFinite(offsetX) || !Number.isFinite(offsetY);
    whenImageReady(imageElement).then(() => {
        if (shouldAutoCenter) {
            centerState(state);
        }
        else {
            state.offsetX = offsetX;
            state.offsetY = offsetY;
            applyTransform(state);
        }
    });
}
export function updateCustomFaceTransform(imageElement, offsetX, offsetY) {
    if (!imageElement) {
        return;
    }
    const state = dragStates.get(imageElement);
    if (!state) {
        return;
    }
    state.offsetX = offsetX;
    state.offsetY = offsetY;
    applyTransform(state);
}
export function disposeCustomFaceDrag(imageElement) {
    if (!imageElement) {
        return;
    }
    const state = dragStates.get(imageElement);
    if (!state) {
        return;
    }
    imageElement.removeEventListener("pointerdown", state.pointerDownHandler);
    imageElement.removeEventListener("pointermove", state.pointerMoveHandler);
    imageElement.removeEventListener("pointerup", state.pointerUpHandler);
    imageElement.removeEventListener("pointercancel", state.pointerUpHandler);
    imageElement.removeEventListener("lostpointercapture", state.pointerUpHandler);
    state.resizeObserver.disconnect();
    dragStates.delete(imageElement);
}
export function centerCustomFace(imageElement) {
    if (!imageElement) {
        return;
    }
    const state = dragStates.get(imageElement);
    if (!state) {
        return;
    }
    whenImageReady(imageElement).then(() => centerState(state));
}
export async function drawCustomFace(canvasId, imageDataUrl, offsetX, offsetY) {
    if (!imageDataUrl || !Number.isFinite(offsetX) || !Number.isFinite(offsetY)) {
        return;
    }
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
        return;
    }
    const [maskImage, faceImage] = await Promise.all([
        getMaskImage(),
        getCustomFaceImage(imageDataUrl)
    ]);
    const offscreenContext = ensureCustomFaceCanvas(maskImage.width, maskImage.height);
    if (!offscreenContext || !customFaceCanvas) {
        return;
    }
    offscreenContext.clearRect(0, 0, customFaceCanvas.width, customFaceCanvas.height);
    offscreenContext.drawImage(faceImage, offsetX, offsetY);
    offscreenContext.globalCompositeOperation = "destination-in";
    offscreenContext.drawImage(maskImage, 0, 0);
    offscreenContext.globalCompositeOperation = "source-over";
    context.drawImage(customFaceCanvas, 0, 0, canvas.width, canvas.height);
}
//# sourceMappingURL=interop.js.map
