using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

using Canvas;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace Tigergenerator.Pages
{
    public partial class Index : ComponentBase
    {
        [Inject]
        public HttpClient Http { get; set; }

        [Inject]
        public JSInterop JSInterop { get; set; }

        bool isLoaded = false;
        readonly ElementReference c;
        readonly ElementReference sprite;
        readonly ElementReference sprite2;
        readonly ElementReference sprite3;

        string text = "En svensk tiger";
        string kropp1 = "gul";
        string kropp2 = "bla";
        string ansikte = null;
        string hatt = null;
        string bindel = null;
        string accessoar = null;

        string textfarg = "black";
        string bakgrundsfarg = null;
        string aktivBakgrundsfarg = null;

        string[] texter = new string[0];

        IDictionary<string, string> kroppar = null;
        IDictionary<string, string> ansikten = null;
        IDictionary<string, string> hattar = null;
        IDictionary<string, string> bindlar = null;
        IDictionary<string, string> accessoarer = null;
        IDictionary<string, string> farger = null;
        IDictionary<string, string> bakgrundFarger = null;

        IDictionary<string, IJSObjectReference> bilder = null;
        readonly string canvasId = "myCanvas";

        private CanvasContext _context;

        protected Canvas2D _canvasReference;
        readonly Random random = new Random();

        protected override async Task OnInitializedAsync()
        {
            texter = await Http.GetFromJsonAsync<string[]>("/texts.json");
            kroppar = await Http.GetFromJsonAsync<Dictionary<string, string>>("/kroppar.json");
            ansikten = await Http.GetFromJsonAsync<Dictionary<string, string>>("/ansikten.json");
            hattar = await Http.GetFromJsonAsync<Dictionary<string, string>>("/hattar.json");
            bindlar = await Http.GetFromJsonAsync<Dictionary<string, string>>("/bindlar.json");
            accessoarer = await Http.GetFromJsonAsync<Dictionary<string, string>>("/accessoarer.json");

            farger = new Dictionary<string, string>() {
                { "Vit", "white" },
                { "Svart", "black" },
                { "Ljusblå", "lightblue" },
                { "Gul", "yellow" }
            };

            var fargerList = farger.ToList();
            fargerList.Insert(0, new KeyValuePair<string, string>("Ingen", ""));

            bakgrundFarger = new Dictionary<string, string>(fargerList);

            bilder = new Dictionary<string, IJSObjectReference>();

            await LoadImages("kroppar1", kroppar);
            await LoadImages("kroppar2", kroppar);
            await LoadImages("ansikten", ansikten);
            await LoadImages("hattar", hattar);
            await LoadImages("bindlar", bindlar);
            await LoadImages("accessoarer", accessoarer);

            isLoaded = true;

            await GetRandomTiger();
        }

        public async ValueTask LoadImages(string dir, IDictionary<string, string> keyValues)
        {
            foreach (var kv in keyValues)
            {
                if (string.IsNullOrEmpty(kv.Value))
                {
                    continue;
                }

                bilder[$"{dir}.{kv.Value}"] = await LoadImage(dir, kv.Value);
            }
        }

        public ValueTask<IJSObjectReference> LoadImage(string dir, string value)
        {
            return JSInterop.LoadImage($"/img/{dir}/{value.ToUpper()}.png");
        }

        private async Task ScrollDown()
        {
            await JSInterop.ScrollToBottomAsync();
        }

        private async Task Share()
        {
            var dataUrl = await _canvasReference.ToDataUrlAsync();
            Console.WriteLine(dataUrl);
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            this._context = await this._canvasReference.GetContextAsync();
        }

        public async Task Generate()
        {
            await GenerateInternal();

            await JSInterop.ScrollToTopAsync();
        }

        public async Task GenerateInternal()
        {
            await this._context.ClearRectAsync(0, 0, _canvasReference.Width, _canvasReference.Height);

            await this._context.SaveAsync();

            if (!string.IsNullOrEmpty(bakgrundsfarg))
            {
                await this._context.SetFillStyleAsync(bakgrundsfarg);
                await this._context.FillRectAsync(0, 0, _canvasReference.Width, _canvasReference.Height);

                aktivBakgrundsfarg = bakgrundsfarg;
            }
            else
            {
                aktivBakgrundsfarg = null;
            }

            if (!string.IsNullOrEmpty(kropp1))
            {
                await this._context.DrawImageAsync(bilder["kroppar1." + kropp1], 0, 0, _canvasReference.Width, _canvasReference.Height);
            }
            if (!string.IsNullOrEmpty(kropp2))
            {
                await this._context.DrawImageAsync(bilder["kroppar2." + kropp2], 0, 0, _canvasReference.Width, _canvasReference.Height);
            }
            if (!string.IsNullOrEmpty(ansikte))
            {
                await this._context.DrawImageAsync(bilder["ansikten." + ansikte], 0, 0, _canvasReference.Width, _canvasReference.Height);
            }
            if (!string.IsNullOrEmpty(bindel))
            {
                await this._context.DrawImageAsync(bilder["bindlar." + bindel], 0, 0, _canvasReference.Width, _canvasReference.Height);
            }
            if (!string.IsNullOrEmpty(accessoar))
            {
                await this._context.DrawImageAsync(bilder["accessoarer." + accessoar], 0, 0, _canvasReference.Width, _canvasReference.Height);
            }
            if (!string.IsNullOrEmpty(hatt))
            {
                await this._context.DrawImageAsync(bilder["hattar." + hatt], 0, 0, _canvasReference.Width, _canvasReference.Height);
            }

            await this._context.SetFillStyleAsync(textfarg);
            await this._context.SetFontAsync("bold 160px IBM Plex Serif");
            await this._context.SetTextAlignAsync(TextAlign.Center);
            await this._context.ScaleAsync(.6, 1);
            await this._context.FillTextAsync(text.ToUpper(), _canvasReference.Width / .6 / 2, 615, _canvasReference.Width / .6 - 40);
            await this._context.RestoreAsync();
        }

        public async Task GetRandomTiger()
        {
            RandomKropp();
            RandomRander();

            RandomAnsikte();
            RandomHatt();
            RandomBindel();

            /*
            while(bindel == "hakkors") 
            {
                bindel = GetRandom(bindlar);
            }
            */

            RandomAccessoar();

            RandomText();

            await GenerateInternal();
        }

        private void RandomKropp()
        {
            kropp1 = GetRandom(kroppar);

            while (kropp1 == kropp2)
            {
                kropp2 = GetRandom(kroppar);
            }
        }

        private void RandomRander()
        {
            kropp2 = GetRandom(kroppar);

            while (kropp1 == kropp2)
            {
                kropp1 = GetRandom(kroppar);
            }
        }

        private void RandomAnsikte()
        {
            ansikte = GetRandom(ansikten);
        }

        private void RandomHatt()
        {
            hatt = GetRandom(hattar);
        }

        private void RandomBindel()
        {
            bindel = GetRandom(bindlar);
        }

        private void RandomAccessoar()
        {
            accessoar = GetRandom(accessoarer);
        }

        private void RandomText()
        {
            text = GetRandom(texter);
        }

        private string GetRandom(IDictionary<string, string> dictionary)
        {
            return dictionary.ElementAt(random.Next(0, dictionary.Count)).Value;
        }

        private string GetRandom(IEnumerable<string> items)
        {
            return items.ElementAt(random.Next(0, items.Count()));
        }

        private async Task DownloadImage()
        {
            await JSInterop.DownloadCanvasAsImage(canvasId);
        }
    }
}