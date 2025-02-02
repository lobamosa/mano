import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Dimensions } from 'react-native';
import API from '../services/api';
import { MyText } from './MyText';
import colors from '../utils/colors';
import picture1 from '../assets/MANO_livraison_elements-04.png';
import picture2 from '../assets/MANO_livraison_elements-05.png';
import picture3 from '../assets/MANO_livraison_elements_Plan_de_travail.png';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { getData, useStorage } from '../services/dataManagement';
import { organisationState } from '../recoil/auth';
import { actionsState } from '../recoil/actions';
import { personsState } from '../recoil/persons';
import { territoriesState } from '../recoil/territory';
import { placesState } from '../recoil/places';
import { relsPersonPlaceState } from '../recoil/relPersonPlace';
import { territoryObservationsState } from '../recoil/territoryObservations';
import { commentsState } from '../recoil/comments';
import { capture } from '../services/sentry';

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const loadingState = atom({
  key: 'loadingState',
  default: '',
});

const progressState = atom({
  key: 'progressState',
  default: 0,
});

const loaderFullScreenState = atom({
  key: 'loaderFullScreenState',
  default: false,
});

export const refreshTriggerState = atom({
  key: 'refreshTriggerState',
  default: {
    status: false,
    options: { showFullScreen: false, initialLoad: false },
  },
});

const mergeItems = (oldItems, newItems) => {
  const newItemsIds = newItems.map((i) => i._id);
  const oldItemsPurged = oldItems.filter((i) => !newItemsIds.includes(i._id));
  return [...oldItemsPurged, ...newItems];
};

const Loader = () => {
  const [picture, setPicture] = useState([picture1, picture3, picture2][randomIntFromInterval(0, 2)]);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh', 0);
  const [loading, setLoading] = useRecoilState(loadingState);
  const [progress, setProgress] = useRecoilState(progressState);
  const [fullScreen, setFullScreen] = useRecoilState(loaderFullScreenState);
  const organisation = useRecoilValue(organisationState);
  const organisationId = organisation?._id;

  const [persons, setPersons] = useRecoilState(personsState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [places, setPlaces] = useRecoilState(placesState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const [territoryObservations, setTerritoryObs] = useRecoilState(territoryObservationsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);

  useEffect(() => {
    if (refreshTrigger.status === true) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger.status]);

  const refresh = async () => {
    const { showFullScreen, initialLoad } = refreshTrigger.options;
    setLoading('Chargement...');
    setFullScreen(showFullScreen);
    /*
    Get number of data to download to show the appropriate loading progress bar
    */
    const response = await API.get({
      path: '/public/stats',
      query: { organisation: organisationId, lastRefresh },
    });
    if (!response.ok) {
      capture('error getting stats', { extra: response });
      setRefreshTrigger({
        status: false,
        options: { showFullScreen: false, initialLoad: false },
      });
      return;
    }

    let total =
      response.data.actions +
      response.data.persons +
      response.data.territories +
      response.data.territoryObservations +
      response.data.places +
      response.data.comments +
      response.data.relsPersonPlace;
    if (initialLoad) {
      const numberOfCollections = 8;
      total = total + numberOfCollections; // for the progress bar to be beautiful
    }
    /*
    Get persons
    */
    if (initialLoad || response.data.persons) {
      setLoading('Chargement des personnes');
      const refreshedPersons = await getData({
        collectionName: 'person',
        data: persons,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newPersons) => setPersons((oldPersons) => (initialLoad ? [...oldPersons, ...newPersons] : mergeItems(oldPersons, newPersons))),
        API,
      });
      if (refreshedPersons) setPersons(refreshedPersons.sort((p1, p2) => p1.name.localeCompare(p2.name)));
    }
    /*
    Get actions
    */
    if (initialLoad || response.data.actions) {
      setLoading('Chargement des actions');
      const refreshedActions = await getData({
        collectionName: 'action',
        data: actions,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newActions) => {
          setActions((oldActions) => (initialLoad ? [...oldActions, ...newActions] : mergeItems(oldActions, newActions)));
        },
        API,
      });
      if (refreshedActions) setActions(refreshedActions);
    }
    /*
    Switch to not full screen
    */
    setFullScreen(false);
    /*
    Get territories
    */
    if (initialLoad || response.data.territories) {
      setLoading('Chargement des territoires');
      const refreshedTerritories = await getData({
        collectionName: 'territory',
        data: territories,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newTerritories) =>
          setTerritories((oldTerritories) => (initialLoad ? [...oldTerritories, ...newTerritories] : mergeItems(oldTerritories, newTerritories))),
        API,
      });
      if (refreshedTerritories) setTerritories(refreshedTerritories);
    }
    /*
    Get places
    */
    if (initialLoad || response.data.places) {
      setLoading('Chargement des lieux');
      const refreshedPlaces = await getData({
        collectionName: 'place',
        data: places,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newPlaces) => setPlaces((oldPlaces) => (initialLoad ? [...oldPlaces, ...newPlaces] : mergeItems(oldPlaces, newPlaces))),
        API,
      });
      if (refreshedPlaces) setPlaces(refreshedPlaces.sort((p1, p2) => p1.name.localeCompare(p2.name)));
    }
    if (initialLoad || response.data.relsPersonPlace) {
      const refreshedRelPersonPlaces = await getData({
        collectionName: 'relPersonPlace',
        data: relsPersonPlace,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newRelPerPlace) =>
          setRelsPersonPlace((oldRelPerPlace) => (initialLoad ? [...oldRelPerPlace, ...newRelPerPlace] : mergeItems(oldRelPerPlace, newRelPerPlace))),
        API,
      });
      if (refreshedRelPersonPlaces) setRelsPersonPlace(refreshedRelPersonPlaces);
    }
    /*
    Get observations territories
    */
    if (initialLoad || response.data.territoryObservations) {
      setLoading('Chargement des observations');
      const refreshedObs = await getData({
        collectionName: 'territory-observation',
        data: territoryObservations,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newObs) => setTerritoryObs((oldObs) => (initialLoad ? [...oldObs, ...newObs] : mergeItems(oldObs, newObs))),
        API,
      });
      if (refreshedObs) setTerritoryObs(refreshedObs);
    }
    /*
    Get comments
    */
    if (initialLoad || response.data.comments) {
      setLoading('Chargement des commentaires');
      const refreshedComments = await getData({
        collectionName: 'comment',
        data: comments,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newComments) =>
          setComments((oldComments) => (initialLoad ? [...oldComments, ...newComments] : mergeItems(oldComments, newComments))),
        API,
      });
      if (refreshedComments) setComments(refreshedComments);
    }

    /*
    Reset refresh trigger
    */
    await new Promise((res) => setTimeout(res, 150));
    setLastRefresh(Date.now());
    setLoading('');
    setProgress(0);
    setFullScreen(false);
    setRefreshTrigger({
      status: false,
      options: { showFullScreen: false, initialLoad: false },
    });
  };

  useEffect(() => {
    setPicture([picture1, picture3, picture2][randomIntFromInterval(0, 2)]);
  }, [fullScreen]);

  if (!loading) return null;
  return (
    <Container fullScreen={fullScreen} testID="loader">
      {!!fullScreen && <ImageStyled source={picture} />}
      <Caption>{loading}</Caption>
      <ProgressContainer fullScreen={fullScreen}>
        <Progress progress={progress} />
      </ProgressContainer>
    </Container>
  );
};

const Container = styled.SafeAreaView`
  width: 100%;
  background-color: ${colors.app.color};
  ${(p) => !p.fullScreen && 'position: absolute;'}
  ${(p) => !p.fullScreen && 'top: 0;'}
  ${(p) => p.fullScreen && 'height: 100%;'}
  ${(p) => p.fullScreen && 'justify-content: center;'}
  ${(p) => p.fullScreen && 'align-items: center;'}
`;

const ImageStyled = styled.Image`
  width: ${Dimensions.get('window').width * 0.8}px;
  height: ${Dimensions.get('window').width * 0.8}px;
`;

const Caption = styled(MyText)`
  /* width: 100%; */
  color: #fff;
  padding: 5px;
`;

const ProgressContainer = styled.View`
  width: 100%;
  height: 7px;
  ${(p) => p.fullScreen && 'width: 75%;'}
  ${(p) => p.fullScreen && 'border-radius: 7px;'}
  ${(p) => p.fullScreen && 'overflow: hidden;'}
  ${(p) => p.fullScreen && 'margin: 15px;'}
  ${(p) => p.fullScreen && 'border: 1px solid #fff;'}
`;

const Progress = styled.View`
  width: ${(p) => p.progress * 100}%;
  min-width: 5%;
  height: 100%;
  background-color: #fff;
`;

export default Loader;
