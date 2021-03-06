import { Switch, useColorMode } from "@chakra-ui/react"
import React from 'react';

export const ThemeToggle = () => {
    const { colorMode, toggleColorMode } = useColorMode();

    return (
        <Switch
            isChecked={colorMode === "dark"}
            onChange={toggleColorMode}
            colorScheme="brand"
            size="md"
            ml={2}
        />
    );
}
