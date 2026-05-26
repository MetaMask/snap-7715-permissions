import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { ErrorMessage } from '../styles';
import { getErrorDisplay } from '../utils';

type ErrorAlertProps = {
  error: unknown;
};

const ErrorSummary = styled.p`
  margin: 0;
`;

const DetailsButton = styled.button`
  background-color: transparent;
  border-color: ${({ theme }) => theme.colors.error?.default};
  color: ${({ theme }) => theme.colors.error?.alternative};
  margin-top: 1.2rem;
  min-height: 3.6rem;
  padding: 0.7rem 1rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.error?.muted};
    border-color: ${({ theme }) => theme.colors.error?.default};
    color: ${({ theme }) => theme.colors.error?.alternative};
  }
`;

const ErrorDetails = styled.pre`
  background-color: ${({ theme }) => theme.colors.background?.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
  border-radius: ${({ theme }) => theme.radii.button};
  color: ${({ theme }) => theme.colors.text?.default};
  font-family: ${({ theme }) => theme.fonts.code};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: 1.5;
  margin: 1.2rem 0 0;
  max-height: 28rem;
  overflow: auto;
  padding: 1.2rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const ErrorAlert = ({ error }: ErrorAlertProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { summary, details } = useMemo(() => getErrorDisplay(error), [error]);
  const hasDetails = details !== summary;

  return (
    <ErrorMessage role="alert">
      <ErrorSummary>
        <b>An error happened:</b> {summary}
      </ErrorSummary>
      {hasDetails && (
        <>
          <DetailsButton
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((currentValue) => !currentValue)}
            type="button"
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </DetailsButton>
          {isExpanded && <ErrorDetails>{details}</ErrorDetails>}
        </>
      )}
    </ErrorMessage>
  );
};
