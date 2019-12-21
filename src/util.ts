import ts from 'typescript';
import { parse } from 'graphql/language';

export const findQueryNode = (sourceFile: ts.SourceFile): ts.TaggedTemplateExpression[] => {
  const result: ts.TaggedTemplateExpression[] = [];

  const visit = (node: ts.Node): any => {
    if (ts.isTaggedTemplateExpression(node)) {
      const { tag, template } = node;

      if ((tag as ts.Identifier).escapedText !== 'gql') { // Cast tag to Identifier because it originally treats as LeftHandSideExpression
        return;
      }

      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        const { rawText } = template;
        if (rawText) {
          const gqlAst = parse(rawText);
          if (gqlAst.kind === 'Document' && gqlAst.definitions.find((d: any) => d.operation === 'query')) {
            result.push(node);
            return true;
          }
        }
      } else if (ts.isTemplateExpression(template)) {
        const { templateSpans } = template;
        templateSpans.forEach(span => {
          const { literal } = span;
          if (ts.isTemplateMiddleOrTemplateTail(literal)) {
            const { rawText } = literal;
            if (rawText) {
              const gqlAst = parse(rawText);
              if (gqlAst.kind === 'Document' && gqlAst.definitions.find((d: any) => d.operation === 'query')) {
                result.push(node);
                return true;
              }
            }
          }
        })
      }
    } else {
      ts.forEachChild(node, visit);
    }
  }
  
  visit(sourceFile);
  return result;
}

interface FilenameAndNode {
  fileName: string;
  nodes: ts.TaggedTemplateExpression[];
}

export const findQueryFilenamAndNode = (program: ts.Program): FilenameAndNode[] => {
  const result: FilenameAndNode[] = [];

  program.getRootFileNames().forEach(fileName => {
    const sourceFile = program.getSourceFile(fileName);
    if (sourceFile) {
      const nodes = findQueryNode(sourceFile)
      if (nodes.length > 0) {
        result.push({ fileName, nodes })
      }
    }
  });

  return result;
}
