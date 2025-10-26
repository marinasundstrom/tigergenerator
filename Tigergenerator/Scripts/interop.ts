export function loadImage(path: string) {
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

export function downloadCanvasAsImage(elementId: string) {
    const canvas = document.getElementById(elementId) as HTMLCanvasElement | null;
    if (!canvas) {
        return;
    }

    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "tiger.png";
    anchor.click();
}

type DotNetReference = {
    invokeMethodAsync: (method: string, ...args: unknown[]) => Promise<unknown>;
};

type FaceDragState = {
    image: HTMLImageElement;
    stage: HTMLElement;
    dotNetRef: DotNetReference | null;
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
    pointerId?: number;
    pointerDownHandler: (event: PointerEvent) => void;
    pointerMoveHandler: (event: PointerEvent) => void;
    pointerUpHandler: (event: PointerEvent) => void;
    resizeObserver: ResizeObserver;
};

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 625;
const MASK_BOUNDS = { left: 128, top: 164, right: 279, bottom: 298 };
const MASK_CENTER_X = (MASK_BOUNDS.left + MASK_BOUNDS.right) / 2;
const MASK_CENTER_Y = (MASK_BOUNDS.top + MASK_BOUNDS.bottom) / 2;

const dragStates = new WeakMap<HTMLImageElement, FaceDragState>();

const customFaceImages = new Map<string, Promise<HTMLImageElement>>();
let maskImagePromise: Promise<HTMLImageElement> | null = null;
let customFaceCanvas: HTMLCanvasElement | null = null;
let customFaceContext: CanvasRenderingContext2D | null = null;

function createImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

function whenImageReady(image: HTMLImageElement): Promise<HTMLImageElement> {
    if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve(image);
    }

    return new Promise((resolve) => {
        image.addEventListener("load", () => resolve(image), { once: true });
    });
}

function updateScale(state: FaceDragState) {
    const rect = state.stage.getBoundingClientRect();
    state.scaleX = rect.width === 0 ? 1 : rect.width / CANVAS_WIDTH;
    state.scaleY = rect.height === 0 ? 1 : rect.height / CANVAS_HEIGHT;
}

function applyTransform(state: FaceDragState) {
    if (state.image.naturalWidth === 0 || state.image.naturalHeight === 0) {
        return;
    }

    updateScale(state);

    state.image.style.width = `${state.image.naturalWidth * state.scaleX}px`;
    state.image.style.height = `${state.image.naturalHeight * state.scaleY}px`;
    state.image.style.transform = `translate(${state.offsetX * state.scaleX}px, ${state.offsetY * state.scaleY}px)`;
}

function notify(state: FaceDragState) {
    state.dotNetRef?.invokeMethodAsync("UpdateCustomFacePosition", state.offsetX, state.offsetY);
}

function centerState(state: FaceDragState) {
    if (state.image.naturalWidth === 0 || state.image.naturalHeight === 0) {
        return;
    }

    state.offsetX = MASK_CENTER_X - state.image.naturalWidth / 2;
    state.offsetY = MASK_CENTER_Y - state.image.naturalHeight / 2;
    applyTransform(state);
    notify(state);
}

function ensureCustomFaceCanvas(width: number, height: number): CanvasRenderingContext2D | null {
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

function getCustomFaceImage(dataUrl: string) {
    if (!customFaceImages.has(dataUrl)) {
        customFaceImages.set(dataUrl, createImage(dataUrl));
    }

    return customFaceImages.get(dataUrl)!;
}

function attachDragHandlers(state: FaceDragState) {
    const { image } = state;

    const pointerDownHandler = (event: PointerEvent) => {
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

    const pointerMoveHandler = (event: PointerEvent) => {
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

    const pointerUpHandler = (event: PointerEvent) => {
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

function ensureState(imageElement: HTMLImageElement, dotNetRef: DotNetReference, stage: HTMLElement) {
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

export function initializeCustomFaceDrag(imageElement: HTMLImageElement | null, dotNetRef: DotNetReference, offsetX: number, offsetY: number, autoCenter: boolean) {
    if (!imageElement) {
        return;
    }

    const stage = imageElement.closest(".custom-face-stage") as HTMLElement | null;
    if (!stage) {
        return;
    }

    const state = ensureState(imageElement, dotNetRef, stage);

    const shouldAutoCenter = autoCenter || !Number.isFinite(offsetX) || !Number.isFinite(offsetY);

    whenImageReady(imageElement).then(() => {
        if (shouldAutoCenter) {
            centerState(state);
        } else {
            state.offsetX = offsetX;
            state.offsetY = offsetY;
            applyTransform(state);
        }
    });
}

export function updateCustomFaceTransform(imageElement: HTMLImageElement | null, offsetX: number, offsetY: number) {
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

export function disposeCustomFaceDrag(imageElement: HTMLImageElement | null) {
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

export function centerCustomFace(imageElement: HTMLImageElement | null) {
    if (!imageElement) {
        return;
    }

    const state = dragStates.get(imageElement);
    if (!state) {
        return;
    }

    whenImageReady(imageElement).then(() => centerState(state));
}

export async function drawCustomFace(canvasId: string, imageDataUrl: string, offsetX: number, offsetY: number) {
    if (!imageDataUrl || !Number.isFinite(offsetX) || !Number.isFinite(offsetY)) {
        return;
    }

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
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
