/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState } from 'react';
import API from '../services/api';
import { mergeNewUpdatedData } from '../services/dataManagement';
import { capture } from '../services/sentry';
import CommentsContext from './comments';

const PersonsContext = React.createContext();

export const PersonsProvider = ({ children }) => {
  const { addComment } = useContext(CommentsContext);

  const [state, setState] = useState({ key: 0, persons: [], encrypted: [], loading: false, lastRefresh: undefined });

  const setPersons = (persons, encrypted) => {
    persons = persons.sort(sortPersons);
    setState(({ key }) => ({ persons, encrypted, key: key + 1, loading: false, lastRefresh: Date.now() }));
  };

  const refreshPersons = async (setProgress, initialLoad) => {
    setState((state) => ({ ...state, loading: true }));
    if (!!initialLoad && !state.lastRefresh) {
      const response = await API.get({ path: '/person', batch: 1000, setProgress });
      if (!response.ok) {
        capture('error getting persons', { extra: { response } });
        setState((state) => ({ ...state, loading: false }));
        return false;
      }
      setPersons(response.decryptedData, response.data);
      return true;
    }
    const response = await API.get({ path: '/person', query: { lastRefresh: state.lastRefresh } });
    if (!response.ok) {
      capture('error refreshing persons', { extra: { response } });
      setState((state) => ({ ...state, loading: false }));
      return false;
    }
    if (response.decryptedData) {
      setPersons(mergeNewUpdatedData(response.decryptedData, state.persons), mergeNewUpdatedData(response.data, state.encrypted));
      return true;
    }
  };

  const deletePerson = async (id) => {
    const res = await API.delete({ path: `/person/${id}` });
    if (res.ok) {
      setState(({ persons, key, ...s }) => ({
        ...s,
        key: key + 1,
        persons: persons.filter((p) => p._id !== id),
      }));
    }
    return res;
  };

  const addPerson = async (person) => {
    try {
      const existingPerson = state.persons.find((p) => p.name === person.name);
      if (existingPerson) return { ok: false, error: 'Un utilisateur existe déjà à ce nom' };
      const response = await API.post({ path: '/person', body: preparePersonForEncryption(person) });
      if (response.ok) {
        setState(({ persons, encrypted, key, ...s }) => ({
          ...s,
          key: key + 1,
          persons: [response.decryptedData, ...persons].sort(sortPersons),
          encrypted: [response.data, ...encrypted],
        }));
      }
      return response;
    } catch (error) {
      capture('error in creating person' + error, { extra: { error, person } });
      return { ok: false, error: error.message };
    }
  };
  const updatePerson = async (person) => {
    try {
      const oldPerson = state.persons.find((a) => a._id === person._id);
      const response = await API.put({
        path: `/person/${person._id}`,
        body: preparePersonForEncryption(person),
      });
      if (response.ok) {
        const newPerson = response.decryptedData;
        setState(({ persons, encrypted, key, ...s }) => ({
          ...s,
          key: key + 1,
          persons: persons.map((p) => {
            if (p._id === person._id) return newPerson;
            return p;
          }),
          encrypted: encrypted.map((p) => {
            if (p._id === person._id) return response.data;
            return p;
          }),
        }));
        const comment = commentForUpdatePerson({ newPerson, oldPerson });
        if (comment) {
          const response = await addComment(comment);
          if (!response.ok) {
            capture(response.error, {
              extra: { message: 'error in creating comment for person update', newPerson, comment },
            });
          }
        }
      }
      return response;
    } catch (error) {
      capture(error, { extra: { message: 'error in updating person', person } });
      return { ok: false, error: error.message };
    }
  };

  return (
    <PersonsContext.Provider
      value={{
        ...state,
        refreshPersons,
        deletePerson,
        addPerson,
        updatePerson,
      }}>
      {children}
    </PersonsContext.Provider>
  );
};

export default PersonsContext;

/*

Utils

*/

const encryptedFields = [
  'user',
  'name',
  'otherNames',
  'gender',
  'birthdate',
  'description',
  'alertness',
  'wanderingAt',
  'personalSituation',
  'nationalitySituation',
  'hasAnimal',
  'structureSocial',
  'structureMedical',
  'employment',
  'address',
  'addressDetail',
  'resources',
  'reasons',
  'healthInsurance',
  'vulnerabilities',
  'consumptions',
  'phone',
  'assignedTeams',
];

export const preparePersonForEncryption = (person) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = person[field];
  }
  return {
    _id: person._id,
    organisation: person.organisation,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,

    decrypted,
    entityKey: person.entityKey,
    ...person,
  };
};

const sortPersons = (p1, p2) => p1.name.localeCompare(p2.name);

const commentForUpdatePerson = ({ newPerson, oldPerson }) => {
  try {
    const commentbody = {
      type: 'person',
      item: newPerson._id,
      person: newPerson._id,
    };
    const notifyChange = (field, before, now) => `Changement ${field}:
    Avant: ${before || 'Non renseigné'}
    Désormais: ${now}`;

    const fieldChanged = (field, stringifyForCheck = false) => {
      const next = stringifyForCheck ? JSON.stringify(newPerson[field]) : newPerson[field];
      const prev = stringifyForCheck ? JSON.stringify(oldPerson[field]) : oldPerson[field];
      if (!next && !prev) return false;
      if (!next && !prev) return false;
      if (!next && !!prev) return true;
      if (!!next && !prev) return true;
      if (next === prev) return false;
      return true;
    };

    let comment = [];

    if (fieldChanged('personalSituation')) {
      comment.push(notifyChange('de situation personnelle', oldPerson.personalSituation, newPerson.personalSituation));
    }
    if (fieldChanged('nationalitySituation')) {
      comment.push(notifyChange('de nationalité', oldPerson.nationalitySituation, newPerson.nationalitySituation));
    }
    if (fieldChanged('structureSocial')) {
      comment.push(notifyChange('de structure de suivi social', oldPerson.structureSocial, newPerson.structureSocial));
    }
    if (fieldChanged('structureMedical')) {
      comment.push(notifyChange('de structure de suivi médical', oldPerson.structureMedical, newPerson.structureMedical));
    }
    if (fieldChanged('employment')) {
      comment.push(notifyChange("d'emploi", oldPerson.employment, newPerson.employment));
    }
    if (fieldChanged('address') || fieldChanged('addressDetail')) {
      const prev = oldPerson.address === 'Oui' ? oldPerson.addressDetail : oldPerson.address;
      const next = newPerson.address === 'Oui' ? newPerson.addressDetail : newPerson.address;
      comment.push(notifyChange("d'hébergement", prev, next));
    }
    if (fieldChanged('resources', true)) {
      comment.push(notifyChange('de ressources', (oldPerson.resources || []).join(', '), (newPerson.resources || []).join(', ')));
    }
    if (fieldChanged('healthInsurance')) {
      comment.push(notifyChange('de couverture médicale', oldPerson.healthInsurance, newPerson.healthInsurance));
    }

    if (comment.length) {
      return {
        ...commentbody,
        comment: comment.join('\n'),
      };
    }
  } catch (error) {
    capture(error, {
      extra: {
        message: 'error in formatting comment for update person',
        newPerson,
        oldPerson,
      },
    });
  }
  return null;
};

/*

Choices on selects

*/

export const reasonsOptions = [
  "Sortie d'hébergement",
  'Expulsion de logement/hébergement',
  "Départ du pays d'origine",
  'Départ de région',
  'Rupture familiale',
  "Perte d'emploi",
  "Sortie d'hospitalisation",
  'Problème de santé',
  "Sortie d'ASE",
  'Sortie de détention',
  'Rupture de soins',
  'Autre',
];

export const vulnerabilitiesOptions = ['Pathologie chronique', 'Psychologique', 'Injecteur', 'Handicap'];

export const ressourcesOptions = [
  'SANS',
  'ARE',
  'RSA',
  'AAH',
  'ADA',
  'Retraite',
  'Salaire',
  'Allocation Chômage',
  'Indemnités journalières',
  'Mendicité',
  'Autre',
];

export const consumptionsOptions = [
  'Héroïne',
  'Buprénorphine/Subutex',
  'Méthadone',
  'Moscantin/Skénan',
  'Cocaïne',
  'Crack',
  'Amphétamine/MDMA/Ecstasy',
  'Benzodiazépines',
  'Cannabis',
  'Alcool',
  'Tabac',
  'Tramadol',
  'Lyrica',
].sort((c1, c2) => c1.localeCompare(c2));

export const addressDetailsFixedFields = [
  'Logement',
  'Hébergement association',
  'Chez un tiers',
  "Mise à l'abri",
  'Logement accompagné',
  'Urgence',
  'Insertion',
];

export const addressDetails = [...addressDetailsFixedFields, 'Autre'];

export const healthInsuranceOptions = ['Aucune', 'Régime Général', 'PUMa', 'AME', 'CSS', 'Autre'];

export const employmentOptions = ['DPH', 'CDD', 'CDDI', 'CDI', 'Interim', 'Bénévolat', 'Sans activité', 'Étudiant', 'Non déclaré', 'Autre'];

export const personalSituationOptions = ['Aucune', 'Homme isolé', 'Femme isolée', 'En couple', 'Famille', 'Autre'];

export const genderOptions = ['Aucun', 'Homme', 'Femme', 'Autre'];

export const nationalitySituationOptions = ['Hors UE', 'UE', 'Française'];

export const yesNoOptions = ['Oui', 'Non'];

export const filterPersonsBase = [
  {
    label: 'Genre',
    field: 'gender',
    options: genderOptions,
  },
  {
    label: 'Consommations',
    field: 'consumptions',
    options: consumptionsOptions,
  },
  {
    label: 'Couverture médicale',
    field: 'healthInsurance',
    options: healthInsuranceOptions,
  },
  {
    label: 'Nationalité',
    field: 'nationalitySituation',
    options: nationalitySituationOptions,
  },
  {
    label: 'Situation personnelle',
    field: 'personalSituation',
    options: personalSituationOptions,
  },
  {
    label: 'Ressources',
    field: 'resources',
    options: ressourcesOptions,
  },
  {
    label: 'Motifs de la situation de rue',
    field: 'reasons',
    options: reasonsOptions,
  },
  {
    label: 'Emploi',
    field: 'employment',
    options: employmentOptions,
  },
  {
    label: 'Vulnérabilités',
    field: 'vulnerabilities',
    options: vulnerabilitiesOptions,
  },
  {
    label: 'Hébergement',
    field: 'address',
    options: yesNoOptions,
  },
  {
    label: 'Avec animaux',
    field: 'hasAnimal',
    options: yesNoOptions,
  },
];