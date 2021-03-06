import { Box } from "@chakra-ui/react";
import React from "react";
import { User } from "../../../generated/graphql";
import GoogleMapReact from 'google-map-react';
import { Marker } from "../../../components/Marker";

interface Props {
  beepers: User[] | undefined;
}

const center = {
  lat: 36.215735,
  lng: -81.674205
};

function BeepersMap(props: Props) {
  const { beepers } = props;

  return (
    <Box mb={4} mt={4} height={350} width='100%'>
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'AIzaSyBgabJrpu7-ELWiUIKJlpBz2mL6GYjwCVI' }}
        defaultCenter={center}
        defaultZoom={13}
      >
        {beepers?.map((beeper: User) => (
          <Marker
            key={beeper.id}
            lat={beeper.location!.latitude}
            lng={beeper.location!.longitude}
            text={beeper.name}
            photoUrl={beeper.photoUrl}
          />
        ))}
      </GoogleMapReact>
    </Box>
  );
}

export default BeepersMap;