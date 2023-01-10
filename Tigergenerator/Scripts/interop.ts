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

export function downloadCanvasAsImage(elementId) {
    const canvas = document.getElementById(elementId) as HTMLCanvasElement;
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "tiger.png"
    anchor.click();
}