import { DefinitionNode, OperationDefinitionNode, FragmentDefinitionNode, Kind } from "graphql/language";

export const findGqlQueryDefinitions = (definitions: ReadonlyArray<DefinitionNode>) => {
  return definitions.filter(d => (d as OperationDefinitionNode).operation === 'query') as OperationDefinitionNode[];
}

export const findGqlFragmentDefinitions = (definitions: ReadonlyArray<DefinitionNode>) => {
  return definitions.filter(d => d.kind === Kind.FRAGMENT_DEFINITION) as FragmentDefinitionNode[];
}
