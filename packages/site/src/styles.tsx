import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

export const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

export const Span = styled.span`
  color: ${(props) => props.theme.colors.primary?.default};
`;

export const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

export const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

export const Box = styled.div`
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  color: ${({ theme }) => theme.colors.text?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

export const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error?.muted};
  border: 1px solid ${({ theme }) => theme.colors.error?.default};
  color: ${({ theme }) => theme.colors.error?.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

export const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  label {
    display: inline-block;
    width: 9rem;
    margin-right: 1rem;
    font-weight: 500;
  }

  textarea,
  input {
    padding: 0.8rem;
    border: 1px solid ${({ theme }) => theme.colors.border?.default};
    border-radius: 0.3rem;
    flex-grow: 1;
  }

  div {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }
`;

export const ResponseContainer = styled.div`
  position: relative;
  & pre {
    max-height: 50rem;
    overflow-y: auto;
    overflow-x: hidden;
  }
`;

export const CopyButton = styled.button`
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background-color: ${({ theme }) => theme.colors.primary?.default};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary?.alternative};
  }
  cursor: pointer;
  font-size: 2rem;
`;
