import * as d from '../../declarations';
import { outputAngular } from '../../compiler/output-targets/output-angular';
import { outputCopy } from './copy/output-copy';
import { outputCustomElements } from './dist-custom-elements';
import { outputCustomElementsBundle } from './dist-custom-elements-bundle';
import { outputDocs } from '../../compiler/output-targets/output-docs';
import { outputHydrateScript } from './dist-hydrate-script';
import { outputLazy } from './dist-lazy/lazy-output';
import { outputLazyLoader } from '../../compiler/output-targets/output-lazy-loader';
import { outputWww } from '../../compiler/output-targets/output-www';
import { outputCollection } from './dist-collection';


export const generateOutputTargets = async (config: d.Config, compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  const timeSpan = buildCtx.createTimeSpan('generate outputs started', true);

  const changedModuleFiles = Array.from(compilerCtx.changedModules)
    .map(filename => compilerCtx.moduleMap.get(filename))
    .filter(mod => mod && !mod.isCollectionDependency);

  compilerCtx.changedModules.clear();

  await Promise.all([
    outputAngular(config, compilerCtx, buildCtx),
    outputCopy(config, compilerCtx, buildCtx),
    outputCollection(config, compilerCtx, buildCtx, changedModuleFiles),
    outputCustomElements(config, compilerCtx, buildCtx, changedModuleFiles),
    outputCustomElementsBundle(config, compilerCtx, buildCtx),
    outputDocs(config, compilerCtx, buildCtx),
    outputHydrateScript(config, compilerCtx, buildCtx),
    outputLazy(config, compilerCtx, buildCtx),
    outputLazyLoader(config, compilerCtx),
    outputWww(config, compilerCtx, buildCtx),
  ]);

  timeSpan.finish('generate outputs finished');
};
