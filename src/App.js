import React, { useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import './app.css';
import { useQuery, gql } from '@apollo/client';
const ALL_PLANETS = gql`
	{
		allPlanets {
			planets {
				name
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
			}
		}
	}
`;

function App() {
	const [displaySideBar, setdisplaySideBar] = useState(false);
	const fetched = useQuery(ALL_PLANETS);
	let gphData = { nodes: [], links: [] };
	if (fetched.data) {
		gphData = constructNodesAndLinks(fetched.data);
	}
	const getHTMLsideBar = (onClose) => {
		return (
			<div className='sideBar'>
				<button onClick={onClose}>Close</button>
				<h1>DESCRIPCION</h1>
			</div>
		);
	};

	return (
		<>
			<ForceGraph3D
				graphData={gphData}
				backgroundColor='#29A9E0'
				width={displaySideBar ? window.innerWidth / 2 : window.innerWidth}
				nodeResolution={10}
				nodeLabel={(node) =>
					node.type === 'planet'
						? `<h3 class="planet-label">${node.label.toUpperCase()}</h3>`
						: `<h3 class="film-label">${node.label.toUpperCase()}</h3>`
				}
				onNodeHover={(node) =>
					(document.getElementById('root').style.cursor = node
						? 'pointer'
						: null)
				}
				nodeColor={(node) =>
					node.type === 'film' ? 'white' : node.films.length ? 'black' : 'blue'
				}
				onNodeClick={() => setdisplaySideBar(!displaySideBar)}
			/>
			{displaySideBar &&
				getHTMLsideBar(() => setdisplaySideBar(!displaySideBar))}
		</>
	);
}

export default App;

function constructNodesAndLinks(data) {
	const filmsTitles = getAllFilmsTitlesHelper(data.allFilms);
	const planetsArray = getAllPlanetsNamessHelper(data.allPlanets);
	const planetWithNoFilmNodes = splitPlanetsWithNoMovies(planetsArray);
	const planetsWithFilmsNodes = splitPlanetsWithMovies(planetsArray);
	const planetsWithFilmsLinks = setPlanetsWithFilmsLinksHelper(
		planetsWithFilmsNodes,
		filmsTitles
	);
	const planetWithNoFilmLinks = setPlanetsWithNoFilmLinksHelper(
		planetWithNoFilmNodes
	);
	let arrayNodes = [
		...planetsWithFilmsNodes,
		planetWithNoFilmNodes,
		filmsTitles,
	].flat();
	let arrayLinks = [...planetsWithFilmsLinks, planetWithNoFilmLinks].flat();

	return { nodes: arrayNodes, links: arrayLinks };
}

function getAllFilmsTitlesHelper(allFilms) {
	return allFilms.films.map((film, i) => {
		return { id: 'film' + i, label: film.title, type: 'film' };
	});
}
function getAllPlanetsNamessHelper(allPlanets) {
	return allPlanets.planets.map((planet, i) => {
		return {
			id: 'planet' + i,
			label: planet.name,
			type: 'planet',
			films: planet.filmConnection.films.map((film) => film.title),
		};
	});
}
function splitPlanetsWithNoMovies(planets) {
	return planets.filter((planet) => planet.films.length === 0);
}
function splitPlanetsWithMovies(planets) {
	return planets.filter((planet) => planet.films.length !== 0);
}
function setPlanetsWithNoFilmLinksHelper(planetsWithNoFilm) {
	//console.log(`planetsWithNoFilm`, planetsWithNoFilm);
	let links = planetsWithNoFilm.map((planet, i) => {
		let planetLinks = [];
		for (let j = i + 1; j < planetsWithNoFilm.length; j++) {
			planetLinks.push({ source: planet.id, target: planetsWithNoFilm[j].id });
		}
		return planetLinks.flat();
	});
	return links.flat();
}

function setPlanetsWithFilmsLinksHelper(planetsWithFilms, films) {
	const getFilmId = (filmName) => {
		let indexFilm = films.findIndex((filmItem) => filmItem.label === filmName);
		return films[indexFilm].id;
	};

	let links = planetsWithFilms.map((planet) => {
		return planet.films.map((filmConnected) => {
			return { source: planet.id, target: getFilmId(filmConnected) };
		});
	});
	return links.flat();
}
