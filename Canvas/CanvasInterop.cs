using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System;
using System.Threading.Tasks;

namespace Canvas
{
    // This class provides an example of how JavaScript functionality can be wrapped
    // in a .NET class for easy consumption. The associated JavaScript module is
    // loaded on demand when first needed.
    //
    // This class can be registered as scoped DI service and then injected into Blazor
    // components for use.

    public class CanvasInterop : IAsyncDisposable
    {
        private readonly Lazy<Task<IJSObjectReference>> moduleTask;

        public CanvasInterop(IJSRuntime jsRuntime)
        {
            moduleTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
               "import", "./_content/Canvas/interop.js").AsTask());
        }

        public async ValueTask<IJSObjectReference> GetContextAsync(ElementReference canvas)
        {
            var module = await moduleTask.Value;
            return await module.InvokeAsync<IJSObjectReference>("getContext", canvas, "2d");
        }

        public async ValueTask<T> GetProp<T>(IJSObjectReference canvas, string name)
        {
            var module = await moduleTask.Value;
            return await module.InvokeAsync<T>("getProp", canvas, name);
        }

        public async ValueTask SetProp(IJSObjectReference canvas, string name, object value)
        {
            var module = await moduleTask.Value;
            await module.InvokeVoidAsync("setProp", canvas, name, value);
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
