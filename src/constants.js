import { gql } from '@apollo/client';

export const ALL_PLANETS = gql`
	{
		allPlanets {
			planets {
				name
				climates
				diameter
				orbitalPeriod
				population
				filmConnection {
					films {
						title
					}
				}
			}
		}
		allFilms {
			films {
				title
				episodeID
				director
				producers
				characterConnection(first: 5) {
					characters {
						name
					}
				}
			}
		}
	}
`;
