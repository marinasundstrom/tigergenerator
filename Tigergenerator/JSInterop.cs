using System;
using System.Net.Http;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Text;
using Microsoft.JSInterop;
using Microsoft.AspNetCore.Components;

namespace Tigergenerator
{
    public class JSInterop
    {
        private IJSRuntime jsRuntime;

        public JSInterop(IJSRuntime jsRuntime) 
        {
            this.jsRuntime = jsRuntime;
        }

        public ValueTask<ElementReference> LoadImage(string path) 
        {
            return jsRuntime.InvokeAsync<ElementReference>("tigergeneratorInterop.loadImage", path);
        }

        public ValueTask ScrollToTopAsync() 
        {
            return jsRuntime.InvokeVoidAsync("tigergeneratorInterop.scrollToTop");
        }
        
        public ValueTask ScrollToBottomAsync() 
        {
            return jsRuntime.InvokeVoidAsync("tigergeneratorInterop.scrollToBottom");
        }
    }
}
