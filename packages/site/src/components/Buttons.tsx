import type { ComponentProps } from 'react';
import styled from 'styled-components';

import { ReactComponent as FlaskFox } from '../assets/flask_fox.svg';
import { kernelSnapOrigin } from '../config';
import { useMetaMask, useRequestSnap } from '../hooks';
import { shouldDisplayReconnectButton } from '../utils';

const Link = styled.a`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.small};
  border-radius: ${(props) => props.theme.radii.button};
  border: 1px solid ${(props) => props.theme.colors.background?.inverse};
  background-color: ${(props) => props.theme.colors.background?.inverse};
  color: ${(props) => props.theme.colors.text?.inverse};
  text-decoration: none;
  font-weight: bold;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: transparent;
    border: 1px solid ${(props) => props.theme.colors.background?.inverse};
    color: ${(props) => props.theme.colors.text?.default};
  }

  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
    box-sizing: border-box;
  }
`;

const Button = styled.button`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonText = styled.span`
  margin-left: 1rem;
`;

const ConnectedContainer = styled.div`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.small};
  border-radius: ${(props) => props.theme.radii.button};
  border: 1px solid ${(props) => props.theme.colors.background?.inverse};
  background-color: ${(props) => props.theme.colors.background?.inverse};
  color: ${(props) => props.theme.colors.text?.inverse};
  font-weight: bold;
  padding: 1.2rem;
`;

const ConnectedIndicator = styled.div`
  content: ' ';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: green;
`;

export const InstallFlaskButton = () => (
  <Link href="https://metamask.io/flask/" target="_blank">
    <FlaskFox />
    <ButtonText>Install MetaMask Flask</ButtonText>
  </Link>
);

export const ConnectButton = (
  props: ComponentProps<typeof Button> & { $isReconnect?: boolean },
) => {
  return (
    <Button {...props}>
      <FlaskFox />
      <ButtonText>{props.$isReconnect ? 'Reconnect' : 'Connect'}</ButtonText>
    </Button>
  );
};

export const InstallButton = (
  props: ComponentProps<typeof Button> & { $isInstalled?: boolean },
) => {
  return (
    <Button {...props}>
      <FlaskFox />
      <ButtonText>{props.$isInstalled ? 'Installed' : 'Install'}</ButtonText>
    </Button>
  );
};

export const CustomMessageButton = (
  props: ComponentProps<typeof Button> & { $text?: string },
) => {
  return <Button {...props}>{props.$text}</Button>;
};

export const HeaderButtons = () => {
  const requestSnap = useRequestSnap(kernelSnapOrigin);
  const { isFlask, installedSnaps } = useMetaMask();

  if (!isFlask && !installedSnaps) {
    return <InstallFlaskButton />;
  }

  if (!installedSnaps[kernelSnapOrigin]) {
    return <ConnectButton onClick={requestSnap} />;
  }

  if (shouldDisplayReconnectButton(installedSnaps[kernelSnapOrigin])) {
    return <ConnectButton onClick={requestSnap} $isReconnect={true} />;
  }

  return (
    <ConnectedContainer>
      <ConnectedIndicator />
      <ButtonText>Connected</ButtonText>
    </ConnectedContainer>
  );
};
