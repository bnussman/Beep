import React, { PureComponent } from "react";
import { Image } from "react-native";

interface Props {
    url: string;
    size: number;
    style?: any;
}

interface State {
    isLoading: boolean;
    isError: boolean;
}

export default class ProfilePicture extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
                <Image
                    style={{...this.props.style, width: this.props.size, height: this.props.size, borderRadius: this.props.size / 2 }}
                    source={{uri: this.props.url}}
                />
        );
    }
}
