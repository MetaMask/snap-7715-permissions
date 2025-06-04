import styled from 'styled-components';

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
