export const stealthScript = `
(() => {
  const patchNavigator = () => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
      configurable: true,
    });
  };

  const patchChrome = () => {
    if (!window.chrome) {
      const makeFns = () => {
        const fn = () => {};
        fn.addListener = () => {};
        fn.removeListener = () => {};
        fn.hasListener = () => false;
        fn.hasListeners = () => false;
        return fn;
      };
      window.chrome = {
        runtime: {
          onMessage: makeFns(),
          onConnect: makeFns(),
          onInstalled: makeFns(),
          connect: () => ({ onMessage: makeFns(), onDisconnect: makeFns() }),
          sendMessage: () => {},
        },
        loadTimes: () => ({
          requestTime: 0,
          startLoadTime: 0,
          commitLoadTime: 0,
          finishDocumentLoadTime: 0,
          finishLoadTime: 0,
          firstPaintTime: 0,
          firstPaintAfterLoadTime: 0,
          navigationType: 'other',
          wasFetchedViaSpdy: true,
          wasNpnNegotiated: true,
          npnNegotiatedProtocol: 'h2',
          wasAlternateProtocolAvailable: false,
          connectionInfo: 'http/2',
        }),
        csi: () => ({
          startE: 0,
          onloadT: 0,
          pageT: Date.now(),
          tran: 15,
        }),
        app: {
          isInstalled: false,
          InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
          RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
        },
        webstore: {
          onInstallStageChanged: makeFns(),
          onDownloadProgress: makeFns(),
        },
      };
    }
  };

  const patchPlugins = () => {
    const pluginData = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
      { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
    ];
    if (navigator.plugins && navigator.plugins.length === 0) {
      const makePlugin = (data, index) => {
        const p = {
          name: data.name,
          filename: data.filename,
          description: data.description,
          length: 0,
          item: (i) => null,
          namedItem: (n) => null,
          refresh: () => {},
          [Symbol.iterator]: function* () {},
        };
        p.__proto__ = Plugin.prototype;
        return p;
      };
      const plugins = pluginData.map((d, i) => makePlugin(d, i));
      plugins.__proto__ = PluginArray.prototype;
      plugins.refresh = () => {};
      plugins.item = (i) => plugins[i] || null;
      plugins.namedItem = (n) => plugins.find(p => p.name === n) || null;
      Object.defineProperty(navigator, 'plugins', {
        get: () => plugins,
        configurable: true,
      });
      const mimeTypes = [
        { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
        { type: 'text/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
      ];
      const mimeArray = mimeTypes.map((m, i) => {
        const mt = {
          type: m.type,
          suffixes: m.suffixes,
          description: m.description,
          enabledPlugin: pluginData[0],
        };
        mt.__proto__ = MimeType.prototype;
        return mt;
      });
      mimeArray.__proto__ = MimeTypeArray.prototype;
      mimeArray.item = (i) => mimeArray[i] || null;
      mimeArray.namedItem = (n) => mimeArray.find(m => m.type === n) || null;
      Object.defineProperty(navigator, 'mimeTypes', {
        get: () => mimeArray,
        configurable: true,
      });
    }
  };

  const patchWebGL = () => {
    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (param) {
        if (param === 37445) return 'Intel Inc.';
        if (param === 37446) return 'Intel Mesa Driver (Haswell)';
        return getParameter.call(this, param);
      };
      if (WebGL2RenderingContext) {
        WebGL2RenderingContext.prototype.getParameter = WebGLRenderingContext.prototype.getParameter;
      }
    } catch (_) {}
  };

  const patchHardware = () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
      configurable: true,
    });
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
      configurable: true,
    });
  };

  const patchLanguages = () => {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['pt-BR', 'pt', 'en-US', 'en'],
      configurable: true,
    });
    Object.defineProperty(navigator, 'language', {
      get: () => 'pt-BR',
      configurable: true,
    });
  };

  const patchScreen = () => {
    Object.defineProperty(screen, 'width', { get: () => 1920, configurable: true });
    Object.defineProperty(screen, 'height', { get: () => 1080, configurable: true });
    Object.defineProperty(screen, 'availWidth', { get: () => 1920, configurable: true });
    Object.defineProperty(screen, 'availHeight', { get: () => 1040, configurable: true });
    Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: true });
    Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: true });
  };

  const patchPermissions = () => {
    if (navigator.permissions && navigator.permissions.query) {
      const originalQuery = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = (desc) => {
        const blocked = ['clipboard-read', 'clipboard-write', 'notifications', 'geolocation'];
        if (blocked.includes(desc.name)) {
          return Promise.resolve({ state: 'prompt', onchange: null });
        }
        return originalQuery(desc);
      };
    }
  };

  const patchConnection = () => {
    if (navigator.connection) {
      Object.defineProperty(navigator.connection, 'rtt', { get: () => 50, configurable: true });
      Object.defineProperty(navigator.connection, 'downlink', { get: () => 10, configurable: true });
      Object.defineProperty(navigator.connection, 'effectiveType', { get: () => '4g', configurable: true });
    }
  };

  const patchPDFViewerEnabled = () => {
    Object.defineProperty(navigator, 'pdfViewerEnabled', {
      get: () => true,
      configurable: true,
    });
  };

  patchNavigator();
  patchChrome();
  patchPlugins();
  patchWebGL();
  patchHardware();
  patchLanguages();
  patchScreen();
  patchPermissions();
  patchConnection();
  patchPDFViewerEnabled();
})();
`;
