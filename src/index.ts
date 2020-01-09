import ts, { ImportDeclaration, NamedImports, getTrailingCommentRanges } from 'typescript';
import fs from 'fs';
import { join } from 'path';
import { findQueryFilenamAndNode, findQueryNode } from './utils/ts-utils';
import { createLanguageServiceHost } from './languageServiceHost';

function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}

const targetDir = './example';
const tsconfigFilePath = './example/tsconfig.json';
const tempOutputDir = './output';

const getTsFileList = (rootDir: string): string[] => {
  const res: string[] = [];
  const extractTsFileList = (dirName: string) => {
    const contentList =  fs.readdirSync(join(dirName), { withFileTypes: true });

    contentList.forEach(c => {
      if (/.*\.(tsx|ts)$/.test(c.name)) {
        res.push(join(dirName, c.name));
      } else if (c.isDirectory()) {
        extractTsFileList(join(dirName, c.name));
      }
    });
  }

  extractTsFileList(rootDir);
  return res;
}

const tsFileList = getTsFileList(join(targetDir, 'src'));

const tsconfig = ts.parseConfigFileTextToJson(tsconfigFilePath, fs.readFileSync(tsconfigFilePath).toString()).config;
const program = ts.createProgram(tsFileList, tsconfig);

const host = createLanguageServiceHost(tsFileList);
const languageService = ts.createLanguageService(host);

const queryFilenameAndNodes = findQueryFilenamAndNode(program, 'query');

let queryList: string[] = [];

queryFilenameAndNodes.forEach(filenameAndNode => {
  const { fileName, nodes } = filenameAndNode;

  nodes.forEach(node => {
    const { template } = node;
    if (ts.isTemplateExpression(template)) {
      const { templateSpans } = template;
      templateSpans.forEach(span => {
        const { expression } = span;
        if (ts.isIdentifier(expression)) {
          const infos = languageService.getDefinitionAtPosition(fileName, expression.pos);
          const sourceFile = program.getSourceFile(fileName)

          if (sourceFile && infos) {
            infos.forEach(info => {
              const { contextSpan } = info;
              if (!contextSpan) { return; }
              const tokenAtPosition = (ts as any).getTokenAtPosition(sourceFile, contextSpan.start); // HACK: using internal api

              if (tokenAtPosition.kind === ts.SyntaxKind.ImportKeyword) {

                const ancestor: ts.ImportDeclaration = (ts as any).findAncestor(tokenAtPosition, ts.isImportDeclaration);
                const { importClause } = ancestor;
                if (!importClause) { return; }
                const { name, namedBindings } = importClause;
                const importIdentifiers = [name, ...(namedBindings as ts.NamedImports).elements.map(el => el.name)].filter(isDefined);
                const targetIdentifier = importIdentifiers.find(i => i.text === expression.text)
                if (!targetIdentifier) { return; }
                console.log('aaaaaaaaaaaaaaaaaaaa')
                console.log(targetIdentifier)

                const def = languageService.getDefinitionAtPosition(fileName, targetIdentifier.pos);

                console.log('bbbbbbbbbbbbbbbb')
                console.log(def)
              }

              const ancestor = (ts as any).findAncestor(tokenAtPosition, ts.isVariableDeclarationList);

              console.log(ancestor)


              const nodes = findQueryNode(ancestor, 'fragment');
              if (nodes.length > 0) {
                const fragments = nodes.map(n => {
                  const { template } = n;
                  if (ts.isNoSubstitutionTemplateLiteral(template)) {
                    return template.rawText;
                  }
                });
                queryList.push([...fragments.filter(isDefined), ...template.templateSpans.map(span => span.literal.rawText).filter(isDefined)].join(''));
              }
            })
          }
        }
      })
    } else if (ts.isNoSubstitutionTemplateLiteral(template)) {
      const { rawText } = template;
      if (rawText) {
        queryList.push(rawText);
      }
    }
  })
})

fs.mkdirSync(tempOutputDir, { recursive: true });
fs.writeFileSync(join(tempOutputDir, './queryList.txt'), queryList.join('\n'))
