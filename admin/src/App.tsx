import React, { Suspense, useState, useEffect } from 'react';
import {
  Admin,
  Resource
} from "react-admin";
import { UserList, UserShow } from "./users";
import { AbilityList, AbilityShow } from "./abilities";
import { AssetList, AssetCreate, AssetEdit } from "./assets";
import { dataProvider } from "./dataProvider";
import DocIcon from "@mui/icons-material/Book";
import UserIcon from "@mui/icons-material/Group";
import ExtensionIcon from '@mui/icons-material/Extension';
import { Dashboard } from "./Dashboard";
import { authProvider } from "./authProvider";

export const App = () => {
  const [abilityResources, setAbilityResources] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    // Fetch abilities from the dataProvider
    dataProvider.getList('abilities', {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: 'name', order: 'ASC' },
      filter: {}
    }).then(response => {
      if (response.data.length === 0) {
        console.log('No abilities found.');
        return;
      }
  
      response.data.forEach(ability => {
        console.log(`Attempting to load admin component for ability: ${ability.id}`);
        const AbilityAdminComponent = React.lazy(() =>
          import(`Abilities/${ability.id}/admin`).then(module => ({
            default: module[`${ability.id}AbilityDashboard`],
          })).catch((error) => {
            console.error(`Failed to load admin component for ability: ${ability.id}`, error);
            return { default: () => <div>Error loading component for ability: {ability.id}</div> };
          })
        );
  
        setAbilityResources(prev => [
          ...prev,
          <Suspense fallback={<div>Loading...</div>} key={ability.id}>
            <AbilityAdminComponent />
          </Suspense>
        ]);
      });
    }).catch(error => {
      console.error('Failed to fetch abilities:', error);
    });
  }, []);

  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider} dashboard={Dashboard}>
      <Resource name="assets" list={AssetList} create={AssetCreate} edit={AssetEdit} icon={DocIcon} />
      <Resource name="users" list={UserList} show={UserShow} recordRepresentation={(record) => `${record.firstName} ${record.lastName}`} icon={UserIcon} />
      <Resource name="abilities" list={AbilityList} show={AbilityShow} recordRepresentation='description' icon={ExtensionIcon} />
      {abilityResources}
    </Admin>
  );
};
