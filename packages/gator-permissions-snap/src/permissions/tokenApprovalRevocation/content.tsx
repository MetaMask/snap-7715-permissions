import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Icon, Section, Text } from '@metamask/snaps-sdk/jsx';

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
export async function renderBody({
  context,
  metadata,
}: {
  context: TokenApprovalRevocationContext;
  metadata: TokenApprovalRevocationMetadata;
}): Promise<SnapElement> {
  const enabledPrimitives = TOKEN_APPROVAL_REVOCATION_PRIMITIVES.filter(
    ({ key }) => context.approvalRevocationPrimitives[key],
  );
  const isAllPrimitivesEnabled =
    enabledPrimitives.length === TOKEN_APPROVAL_REVOCATION_PRIMITIVES.length;

  return (
    <Box>
      <Section>
        <Field
          label={t('approvalRevocationPrimitivesLabel')}
          variant="display"
          direction="vertical"
        >
          <Box>
            {isAllPrimitivesEnabled ? (
              <Text>{t('allApprovalRevocationPrimitivesLabel')}</Text>
            ) : (
              enabledPrimitives.map(({ key, labelKey }) => (
                <Box direction="horizontal" key={key}>
                  <Icon name="minus" color="default" size="inherit" />
                  <Text>{t(labelKey)}</Text>
                </Box>
              ))
            )}
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
