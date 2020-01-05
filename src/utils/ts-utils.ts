import ts from 'typescript';
import { parse, DefinitionNode, OperationDefinitionNode, FragmentDefinitionNode } from 'graphql/language';
import { findGqlQueryDefinitions, findGqlFragmentDefinitions } from './grphql-utils';

export const findQueryNode = (sourceFile: ts.SourceFile, type: string): ts.TaggedTemplateExpression[] => {
  const result: ts.TaggedTemplateExpression[] = [];

  let findGqlNodeCondition: (definitions: ReadonlyArray<DefinitionNode>) => OperationDefinitionNode[] | FragmentDefinitionNode[];
  if(type === 'query') {
    findGqlNodeCondition = findGqlQueryDefinitions;
  } else if(type === 'fragment') {
    findGqlNodeCondition = findGqlFragmentDefinitions;
  } else {
    throw new Error('Unknown query type');
  }

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
          if (findGqlNodeCondition(gqlAst.definitions).length > 0) {
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
              if (findGqlNodeCondition(gqlAst.definitions).length > 0) {
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

export const findQueryFilenamAndNode = (program: ts.Program, queryType: string): FilenameAndNode[] => {
  const result: FilenameAndNode[] = [];

  program.getRootFileNames().forEach(fileName => {
    const sourceFile = program.getSourceFile(fileName);
    if (sourceFile) {
      const nodes = findQueryNode(sourceFile, queryType)
      if (nodes.length > 0) {
        result.push({ fileName, nodes })
      }
    }
  });

  return result;
}
