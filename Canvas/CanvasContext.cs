using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Canvas
{
    public class CanvasContext
    {
        public CanvasContext(CanvasInterop canvasInterop, IJSObjectReference canvasObject)
        {
            this.canvasInterop = canvasInterop;
            this.canvasObject = canvasObject;
        }

        private IJSObjectReference canvasObject;
        private readonly CanvasInterop canvasInterop;

        public async ValueTask ClearRectAsync(int dx, int dy, long dWidth, long dHeight)
        {
            await canvasObject.InvokeVoidAsync("clearRect", dx, dy, dWidth, dHeight);
        }

        public async ValueTask FillRectAsync(int dx, int dy, long dWidth, long dHeight)
        {
            await canvasObject.InvokeVoidAsync("fillRect", dx, dy, dWidth, dHeight);
        }

        public async ValueTask SetFillStyleAsync(string value)
        {
            await canvasInterop.SetProp(canvasObject, "fillStyle", value);

        }

        public async ValueTask SetFontAsync(string value)
        {
            await canvasInterop.SetProp(canvasObject, "font", value);
        }

        public async ValueTask SetTextAlignAsync(TextAlign value)
        {
            await canvasInterop.SetProp(canvasObject, "textAlign", value.ToString().ToLower());
        }

        public async ValueTask ScaleAsync(double x, double y)
        {
            await canvasObject.InvokeVoidAsync("scale", x, y);
        }

        public async ValueTask FillTextAsync(string text, double dx, double dy, double maxWidth)
        {
            await canvasObject.InvokeVoidAsync("fillText", text, dx, dy, maxWidth);
        }

        public async ValueTask DrawImageAsync(IJSObjectReference image, int dx, int dy, long dWidth, long dHeight)
        {
            await canvasObject.InvokeVoidAsync("drawImage", image, dx, dy, dWidth, dHeight);
        }

        public async ValueTask RestoreAsync()
        {
            await canvasObject.InvokeVoidAsync("restore");
        }

        public async ValueTask SaveAsync()
        {
            await canvasObject.InvokeVoidAsync("save");
        }
    }

    public enum TextAlign
    {
        Start = 0,
        End = 1,
        Left = 2,
        Right = 3,
        Center = 4
    }
}
