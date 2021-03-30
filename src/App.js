import React, { useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useQuery } from '@apollo/client';
import { ALL_PLANETS } from './constants';
import './App.css';

function App() {
	let gphData;
	const [displaySideBar, setdisplaySideBar] = useState(false);
	const [displayFilminfo, setdisplayFilminfo] = useState(false);
	const [nodeInfo, setnodeInfo] = useState(false);
	const fetched = useQuery(ALL_PLANETS);
	// TODO: The 3d-force-graph *should not* renderize everytime the app listens a change.
	if (fetched.data) {
		let filmsTitles = getAllFilmsTitlesHelper(fetched.data.allFilms);
		let planetsArray = getAllPlanetsNamessHelper(fetched.data.allPlanets);
		gphData = constructNodesAndLinks(filmsTitles, planetsArray);
	}

	const handleOnNodeClick = (node) => {
		setdisplaySideBar(!displaySideBar);
		node.type === 'film' ? setdisplayFilminfo(true) : setdisplayFilminfo(false);
		setnodeInfo(node);
	};
	const handleOnCloseSideBar = () => {
		setnodeInfo(false);
		setdisplaySideBar(!displaySideBar);
	};

	const getHTMLforFilmInfo = () => {
		// TODO: Make this elements editable.
		return (
			<div className='text-container'>
				<h1>{nodeInfo.label}</h1>
				<h2 className='up-row'>Episode: {nodeInfo.episodeID}</h2>
				<div className='left-col'>
					<h3>Director:</h3> <p>{nodeInfo.director}</p>
					<h3>Producers:</h3>
					{nodeInfo.producers.map((producer) => (
						<p>{producer}</p>
					))}
				</div>
				<div className='right-col'>
					<h3>Characters:</h3>
					<ul>
						{nodeInfo.characters.map((character) => (
							<li>{character.name}</li>
						))}
					</ul>
				</div>
			</div>
		);
	};

	const getHTMLforPlanetInfo = () => {
		// TODO: Make this elements editable.
		return (
			<div className='text-container'>
				<h1 className='up-row'>{nodeInfo.label}</h1>
				<div className='left-col'>
					<h3>Diameter:</h3> <p>{nodeInfo.diameter}</p>
					<h3>Population:</h3> <p>{nodeInfo.population}</p>
					<h3>Climates:</h3>
					{nodeInfo.climates.map((climate) => (
						<p>{climate}</p>
					))}
				</div>
				<div className='right-col'>
					<h3>Films:</h3>
					<ul>
						{nodeInfo.films.map((film) => (
							<li>{film}</li>
						))}
					</ul>
				</div>
			</div>
		);
	};

	return (
		<section>
			<div className='color'></div>
			<div className='color'></div>
			<div className='color'></div>
			<ForceGraph3D
				graphData={gphData}
				backgroundColor='#29A9E0'
				nodeResolution={10}
				nodeLabel={(node) =>
					node.type === 'planet'
						? `<h3 class="planet-label">${node.label}</h3>`
						: `<h3 class="film-label">${node.label}</h3>`
				}
				onNodeHover={(node) =>
					(document.getElementById('root').style.cursor = node
						? 'pointer'
						: null)
				}
				nodeColor={(node) =>
					node.type === 'film'
						? 'black'
						: node.films.length
						? '#473BF0'
						: '#ca9ce1'
				}
				onNodeClick={(node) => handleOnNodeClick(node)}
			/>
			{/*TODO: The elements below must be converted into a React Component <SideBar />*/}
			{displaySideBar && nodeInfo && (
				<div className={`sideBar ${displaySideBar ? 'appear' : ''}`}>
					{displayFilminfo ? getHTMLforFilmInfo() : getHTMLforPlanetInfo()}
					<button onClick={() => handleOnCloseSideBar()}>Close</button>
				</div>
			)}
		</section>
	);
}

export default App;

function constructNodesAndLinks(filmsTitles, planetsArray) {
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
		return {
			id: 'film' + i,
			label: film.title,
			type: 'film',
			episodeID: film.episodeID,
			director: film.director,
			producers: film.producers,
			characters: film.characterConnection.characters,
		};
	});
}

function getAllPlanetsNamessHelper(allPlanets) {
	return allPlanets.planets
		.map((planet, i) => {
			return {
				id: 'planet' + i,
				label: planet.name,
				type: 'planet',
				films: planet.filmConnection.films.map((film) => film.title),
				climates: planet.climates,
				diameter: planet.diameter,
				orbitalPeriod: planet.orbitalPeriod,
				population: planet.population,
			};
		})
		.filter((planet) => planet.label !== 'unknown');
}
function splitPlanetsWithNoMovies(planets) {
	return planets.filter((planet) => planet.films.length === 0);
}
function splitPlanetsWithMovies(planets) {
	return planets.filter((planet) => planet.films.length !== 0);
}

function setPlanetsWithNoFilmLinksHelper(planetsWithNoFilm) {
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
