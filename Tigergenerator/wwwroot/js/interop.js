window.tigergeneratorInterop = {
    loadImage(path) {
        return new Promise((resolve, error) => {
            const image = new Image();
            image.id = path;
            image.onload = () => {
                const image2  = document.getElementById(path);
                resolve(image2);
            };
            image.onerror = (err) => {
                error(err);
            };
            image.src = path;
            image.hidden = true;
            document.body.append(image);
        });
    },
    scrollToTop() {
        window.scrollTo(0, 0);
    },
    scrollToBottom() {
        var elmnt = document.getElementById("attributesHeader");
        elmnt.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
    }
};