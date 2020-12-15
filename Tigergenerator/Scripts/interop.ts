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
};

export function scrollToTop() {
    window.scrollTo(0, 0);
};

export function scrollToBottom() {
    var elmnt = document.getElementById("attributesHeader");
    elmnt.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
};