export function getContext(canvas, type: "2d" | "") {
    return canvas.getContext(type);
}

export function setProp(obj, name, value) {
    obj[name] = value;
}

export function getProp(obj, name) {
    return obj[name];
}