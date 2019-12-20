/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllPersons
// ====================================================

export interface AllPersons_allPersons_films {
  __typename: "Film";
  director: string | null;
}

export interface AllPersons_allPersons {
  __typename: "Person";
  name: string;
  films: AllPersons_allPersons_films[] | null;
}

export interface AllPersons {
  allPersons: AllPersons_allPersons[];
}
