import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Section, Text } from '@metamask/snaps-sdk/jsx';

import { expiryRule } from './rules';
import { TOKEN_APPROVAL_REVOCATION_PRIMITIVES } from './types';
import type {
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata,
} from './types';
import { renderRules } from '../../core/rules';
import { Field } from '../../ui/components/Field';
import { t } from '../../utils/i18n';

/**
 * Creates UI content for a token approval revocation permission.
 * Expiry is configurable by the user; redeemer addresses are read-only from the dapp.
 * @param args - The options object containing the context and metadata.
 * @param args.context - The context containing the permission details.
 * @param args.metadata - The metadata containing the validation errors.
 * @returns A Promise that resolves to the UI element for the confirmation dialog.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: TokenApprovalRevocationContext;
  metadata: TokenApprovalRevocationMetadata;
}): Promise<SnapElement> {
  const enabledMechanisms = TOKEN_APPROVAL_REVOCATION_PRIMITIVES.filter(
    ({ key }) => context.approvalRevocationMechanisms[key],
  );

  return (
    <Box>
      <Section>
        <Field
          label={t('approvalRevocationMechanismsLabel')}
          variant="display"
          direction="vertical"
        >
          <Box>
            {enabledMechanisms.map(({ key, labelKey }) => (
              <Text key={key}>{t(labelKey)}</Text>
            ))}
          </Box>
        </Field>
        <Divider />
        {renderRules({
          rules: [expiryRule],
          context,
          metadata,
        })}
      </Section>
    </Box>
  );
}
