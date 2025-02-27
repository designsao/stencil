import * as d from '../../../declarations';
import { buildError, isBoolean, isString } from '@utils';
import { COPY, DIST_GLOBAL_STYLES, DIST_LAZY, WWW, isOutputTargetWww } from '../../../compiler/output-targets/output-utils';
import { getAbsolutePath } from '../utils';
import { validateCopy } from '../../../compiler/config/validate-copy';
import { validatePrerender } from '../../../compiler/config/validate-prerender';
import { validateServiceWorker } from '../../../compiler/config/validate-service-worker';
import path from 'path';


export const validateWww = (config: d.Config, diagnostics: d.Diagnostic[], userOutputs: d.OutputTarget[]) => {
  const hasOutputTargets = Array.isArray(userOutputs);
  const hasE2eTests = !!(config.flags && config.flags.e2e);
  const userWwwOutputs = userOutputs.filter(isOutputTargetWww);

  if (!hasOutputTargets || (hasE2eTests && !userWwwOutputs.some(isOutputTargetWww))) {
    userWwwOutputs.push({ type: WWW });
  }

  if (config.flags.prerender && userWwwOutputs.length === 0) {
    const err = buildError(diagnostics);
    err.messageText = `You need at least one "www" output target configured in your stencil.config.ts, when the "--prerender" flag is used`;
  }

  return userWwwOutputs.reduce((outputs, o) => {
    const outputTarget = validateWwwOutputTarget(config, o, diagnostics);
    outputs.push(outputTarget);

    // Add dist-lazy output target
    const buildDir = outputTarget.buildDir;
    outputs.push({
      type: DIST_LAZY,
      dir: buildDir,
      esmDir: buildDir,
      systemDir: config.buildEs5 ? buildDir : undefined,
      systemLoaderFile: config.buildEs5 ? config.sys.path.join(buildDir, `${config.fsNamespace}.js`) : undefined,
      polyfills: outputTarget.polyfills,
      isBrowserBuild: true,
    });

    // Copy for dist
    outputs.push({
      type: COPY,
      dir: buildDir,
      copyAssets: 'dist'
    });

    // Copy for www
    outputs.push({
      type: COPY,
      dir: outputTarget.appDir,
      copy: validateCopy(outputTarget.copy, [
        ...(config.copy || []),
        { src: 'assets', warn: false },
        { src: 'manifest.json', warn: false },
      ]),
    });

    // Generate global style with original name
    outputs.push({
      type: DIST_GLOBAL_STYLES,
      file: path.join(buildDir, `${config.fsNamespace}.css`),
    });

    return outputs;
  }, []);
};


const validateWwwOutputTarget = (config: d.Config, outputTarget: d.OutputTargetWww, diagnostics: d.Diagnostic[]) => {
  if (!isString(outputTarget.baseUrl)) {
    outputTarget.baseUrl = '/';
  }

  if (!outputTarget.baseUrl.endsWith('/')) {
    // Make sure the baseUrl always finish with "/"
    outputTarget.baseUrl += '/';
  }

  outputTarget.dir = getAbsolutePath(config, outputTarget.dir || 'www');

  // Fix "dir" to account
  outputTarget.appDir = path.join(outputTarget.dir, getUrlPathName(outputTarget.baseUrl));

  if (!isString(outputTarget.buildDir)) {
    outputTarget.buildDir = 'build';
  }

  if (!path.isAbsolute(outputTarget.buildDir)) {
    outputTarget.buildDir = path.join(outputTarget.appDir, outputTarget.buildDir);
  }

  if (!isString(outputTarget.indexHtml)) {
    outputTarget.indexHtml = 'index.html';
  }

  if (!path.isAbsolute(outputTarget.indexHtml)) {
    outputTarget.indexHtml = path.join(outputTarget.appDir, outputTarget.indexHtml);
  }

  if (!isBoolean(outputTarget.empty)) {
    outputTarget.empty = true;
  }

  validatePrerender(config, diagnostics, outputTarget);
  validateServiceWorker(config, outputTarget);

  if (outputTarget.polyfills === undefined) {
    outputTarget.polyfills = true;
  }
  outputTarget.polyfills = !!outputTarget.polyfills;

  return outputTarget;
};

const getUrlPathName = (url: string) => new URL(url, 'http://localhost/').pathname;
