import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Spinner from '../../components/Spinner';
import { ListEmptyTerritories, ListNoMoreTerritories } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import FlatListStyled from '../../components/FlatListStyled';
import Search from '../../components/Search';
import Row from '../../components/Row';
import { TerritoryIcon } from '../../icons';
import { useRecoilState, useRecoilValue } from 'recoil';
import { territoriesSearchSelector } from '../../recoil/selectors';
import API from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { refreshTriggerState, loadingState } from '../../components/Loader';

const TerritoriesList = () => {
  const [search, setSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);

  const navigation = useNavigation();

  const loading = useRecoilValue(loadingState);
  const territories = useRecoilValue(territoriesSearchSelector({ search }));

  useEffect(() => {
    API.navigation = navigation;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  };

  const onCreateTerritoryRequest = () =>
    navigation.navigate('NewTerritoryForm', {
      fromRoute: 'TerritoriesList',
      toRoute: 'Territory',
    });

  const keyExtractor = (territory) => territory._id;
  const ListFooterComponent = () => {
    if (!territories.length) return null;
    return <ListNoMoreTerritories />;
  };
  const renderRow = ({ item: territory }) => {
    const { name } = territory;
    return (
      <Row
        withNextButton
        onPress={() => navigation.push('Territory', { ...territory, fromRoute: 'TerritoriesList' })}
        Icon={TerritoryIcon}
        caption={name}
        testID={`territory-row-${name?.split(' ').join('-').toLowerCase()}-button`}
      />
    );
  };

  const listRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: scrollY,
          },
        },
      },
    ],
    { useNativeDriver: true }
  );

  return (
    <SceneContainer>
      <ScreenTitle title="Territoires" parentScroll={scrollY} />
      <Search
        placeholder="Rechercher un territoire..."
        onChange={setSearch}
        onFocus={() => listRef.current.scrollToOffset({ offset: 100 })}
        parentScroll={scrollY}
      />
      <FlatListStyled
        ref={listRef}
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        onScroll={onScroll}
        parentScroll={scrollY}
        data={territories}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        ListEmptyComponent={loading ? Spinner : ListEmptyTerritories}
        initialNumToRender={10}
        ListFooterComponent={ListFooterComponent}
        defaultTop={0}
      />
      <FloatAddButton onPress={onCreateTerritoryRequest} testID="add-territory-button" />
    </SceneContainer>
  );
};

export default TerritoriesList;
