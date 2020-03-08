import gql from 'graphql-tag';

export const allPersonName = gql`
  fragment AllPersonName on AllPersons {
    name
  }
`;
