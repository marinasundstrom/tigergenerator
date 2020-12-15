﻿using Blazor.Extensions;
using Blazor.Extensions.Canvas.Canvas2D;
using Microsoft.AspNetCore.Components;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace Tigergenerator.Pages
{
    public partial class Index : ComponentBase
    {
        [Inject]
        public HttpClient Http { get; set; }

        [Inject]
        public JSInterop JSInterop { get; set; }

        bool isLoaded = false;

        ElementReference sprite;
        ElementReference sprite2;
        ElementReference sprite3;

        string text = "En svensk tiger";
        string kropp1 = "gul";
        string kropp2 = "bla";
        string ansikte = null;
        string hatt = null;
        string bindel = null;
        string accessoar = null;

        string textfarg = "black";
        string bakgrundsfarg = null;

        string[] texter = new string[0];

        IDictionary<string, string> kroppar = null;
        IDictionary<string, string> ansikten = null;
        IDictionary<string, string> hattar = null;
        IDictionary<string, string> bindlar = null;
        IDictionary<string, string> accessoarer = null;
        IDictionary<string, string> farger = null;

        IDictionary<string, ElementReference> bilder = null;

        private Canvas2DContext _context;

        protected BECanvasComponent _canvasReference;

        Random random = new Random();

        protected override async Task OnInitializedAsync()
        {
            texter = await Http.GetFromJsonAsync<string[]>("/texts.json");
            kroppar = await Http.GetFromJsonAsync<Dictionary<string, string>>("/kroppar.json");
            ansikten = await Http.GetFromJsonAsync<Dictionary<string, string>>("/ansikten.json");
            hattar = await Http.GetFromJsonAsync<Dictionary<string, string>>("/hattar.json");
            bindlar = await Http.GetFromJsonAsync<Dictionary<string, string>>("/bindlar.json");
            accessoarer = await Http.GetFromJsonAsync<Dictionary<string, string>>("/accessoarer.json");

            farger = new Dictionary<string, string>() {
            { "Ingen", "" },
            { "Vit", "white" },
            { "Svart", "black" },
            { "Ljusblå", "lightblue" },
            { "Gul", "yellow" }
        };

            bilder = new Dictionary<string, ElementReference>();

            await LoadImages("kroppar1", kroppar);
            await LoadImages("kroppar2", kroppar);
            await LoadImages("ansikten", ansikten);
            await LoadImages("hattar", hattar);
            await LoadImages("bindlar", bindlar);
            await LoadImages("accessoarer", accessoarer);

            isLoaded = true;
        }

        List<(string dir, string id)> bildLoader = new List<(string dir, string id)>();

        public async Task LoadImages(string dir, IDictionary<string, string> keyValues)
        {
            foreach (var kv in keyValues)
            {
                //bilder[kv.Value] = await LoadImage(dir, kv.Value);

                bildLoader.Add((dir: dir, id: kv.Value));
            }
        }

        public async Task<ElementReference> LoadImage(string dir, string value)
        {
            return await JSInterop.LoadImage($"/img/{dir}/{value.ToUpper()}.png");
        }

        private async Task ScrollDown()
        {
            await JSInterop.ScrollToBottomAsync();
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            this._context = await this._canvasReference.CreateCanvas2DAsync();
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
            kropp1 = GetRandom(kroppar);

            kropp2 = GetRandom(kroppar);

            while (kropp1 == kropp2)
            {
                kropp2 = GetRandom(kroppar);
            }

            ansikte = GetRandom(ansikten);
            hatt = GetRandom(hattar);
            bindel = GetRandom(bindlar);

            /*
            while(bindel == "hakkors") 
            {
                bindel = GetRandom(bindlar);
            }
            */

            accessoar = GetRandom(accessoarer);

            text = GetRandom(texter);

            await GenerateInternal();
        }

        private string GetRandom(IDictionary<string, string> dictionary)
        {
            //Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(dictionary));

            return dictionary.ElementAt(random.Next(0, dictionary.Count)).Value;
        }

        private string GetRandom(IEnumerable<string> items)
        {
            return items.ElementAt(random.Next(0, items.Count()));
        }
    }
}
