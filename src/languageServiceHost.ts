import ts from 'typescript';
import fs from 'fs';

export const createLanguageServiceHost = (fileList: string[]) => {
  const languageServiceHost: ts.LanguageServiceHost = {
    getCompilationSettings: () => ts.getDefaultCompilerOptions(),
    getScriptFileNames: () => fileList, 
    getScriptVersion: (_fileName: string) => '0',
    getScriptSnapshot: (fileName: string) => ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString()),
    getCurrentDirectory: () => process.cwd(),
    getDefaultLibFileName: (options: ts.CompilerOptions) => ts.getDefaultLibFilePath(options),
  }

  return languageServiceHost;
}
