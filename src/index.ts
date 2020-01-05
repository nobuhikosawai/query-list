import ts from 'typescript';
import fs from 'fs';
import { join } from 'path';
import { findQueryFilenamAndNode, findQueryNode } from './utils/ts-utils';
import { createLanguageServiceHost } from './languageServiceHost';

const targetDir = './example';
const tsconfigFilePath = './example/tsconfig.json';
const tempOutputDir = './output';

const filelist = fs.readdirSync(join(targetDir, 'src'), { withFileTypes: true });

function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}

const tsFileList = filelist.map(file => {
  if (/.*\.(tsx|ts)$/.test(file.name)) {
    return join(targetDir, `src/${file.name}`)
  }
}).filter(isDefined);

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
              const ancestor = (ts as any).findAncestor(tokenAtPosition, ts.isVariableDeclarationList);
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
