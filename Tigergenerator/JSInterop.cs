using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Tigergenerator
{
    public class JSInterop : IAsyncDisposable
    {
        private readonly Lazy<Task<IJSObjectReference>> moduleTask;

        public JSInterop(IJSRuntime jsRuntime)
        {
            moduleTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
               "import", "./js/interop.js").AsTask());
        }

        public async ValueTask<IJSObjectReference> LoadImage(string path)
        {
            var module = await moduleTask.Value;
            return await module.InvokeAsync<IJSObjectReference>("loadImage", path);
        }

        public async ValueTask ScrollToTopAsync()
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("scrollToTop");
        }

        public async ValueTask ScrollToBottomAsync()
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("scrollToBottom");
        }

        public async ValueTask DownloadCanvasAsImage(string elementId)
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("downloadCanvasAsImage", elementId);
        }

        public async ValueTask InitializeCustomFaceDrag<T>(ElementReference imageElement, DotNetObjectReference<T> dotNetReference, double offsetX, double offsetY, double scale, bool autoCenter) where T : class
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("initializeCustomFaceDrag", imageElement, dotNetReference, offsetX, offsetY, scale, autoCenter);
        }

        public async ValueTask UpdateCustomFaceTransform(ElementReference imageElement, double offsetX, double offsetY, double scale)
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("updateCustomFaceTransform", imageElement, offsetX, offsetY, scale);
        }

        public async ValueTask SetCustomFaceScale(ElementReference imageElement, double scale)
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("setCustomFaceScale", imageElement, scale);
        }

        public async ValueTask DisposeCustomFaceDrag(ElementReference imageElement)
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("disposeCustomFaceDrag", imageElement);
        }

        public async ValueTask CenterCustomFace(ElementReference imageElement)
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("centerCustomFace", imageElement);
        }

        public async ValueTask DrawCustomFace(string canvasId, string imageDataUrl, double offsetX, double offsetY, double scale)
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("drawCustomFace", canvasId, imageDataUrl, offsetX, offsetY, scale);
        }

        public async ValueTask DisposeAsync()
        {
            if (moduleTask.IsValueCreated)
            {
                var module = await moduleTask.Value;
                await module.DisposeAsync();
            }
        }
    }
}