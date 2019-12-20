import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import gql from 'graphql-tag';
import { AllPersons } from './__generated__/AllPersons';

const link = ApolloLink.from([
  onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ),
      );
    if (networkError) console.log(`[Network error]: ${networkError}`);
  }),
  new HttpLink({
    uri: 'https://api.graph.cool/simple/v1/swapi',
  })
]);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache()
});

const ALL_PERSON = gql`
  query AllPersons{
    allPersons {
      name
      films {
        director
      }
    }
  }
`;

const App: React.FC = () => {
  const { loading, error, data } = useQuery<AllPersons>(ALL_PERSON, { client });

  if (loading) return <div>'loading...'</div>;
  if (error) return <div>Error! ${error.message}</div>;

  return (
    <div className="App">
      { data && data.allPersons.map((d, idx) => <p key={idx}>{d.name}</p>)}
    </div>
  );
}

export default App;
