import { describe, expect, it } from '@jest/globals';
import { NO_ASSET_ADDRESS } from '@metamask/7715-permissions-shared/types';

import { createConfirmationContent } from '../../../src/permissions/erc20TokenRevocation/content';
import type {
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
} from '../../../src/permissions/erc20TokenRevocation/types';

const mockContext: Erc20TokenRevocationContext = {
  expiry: {
    timestamp: 1714521600, // 05/01/2024
    isAdjustmentAllowed: true,
  },
  isAdjustmentAllowed: true,
  justification: 'Permission to revoke approvals',
  accountAddressCaip10: `eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`,
  tokenAddressCaip19: NO_ASSET_ADDRESS,
  tokenMetadata: {
    symbol: '',
    decimals: 0,
    iconDataBase64: '',
  },
};

const mockMetadata: Erc20TokenRevocationMetadata = {
  validationErrors: {},
};

describe('erc20TokenRevocation:content', () => {
  describe('createConfirmationContent()', () => {
    it('should render content with expiry rule', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(content).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "children": [
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": "Expiry",
                              },
                              "type": "Text",
                            },
                            {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "color": "muted",
                                    "name": "question",
                                    "size": "inherit",
                                  },
                                  "type": "Icon",
                                },
                                "content": {
                                  "key": null,
                                  "props": {
                                    "children": "The expiry date of the permission (mm/dd/yyyy hh:mm:ss).",
                                  },
                                  "type": "Text",
                                },
                              },
                              "type": "Tooltip",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "alignment": "end",
                          "children": {
                            "key": null,
                            "props": {
                              "children": "mm/dd/yyyy hh:mm:ss",
                              "color": "muted",
                              "size": "sm",
                            },
                            "type": "Text",
                          },
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "alignment": "space-between",
                    "children": {
                      "key": null,
                      "props": {
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "name": "erc20-token-revocation-expiry_date",
                              "placeholder": "mm/dd/yyyy",
                              "type": "text",
                              "value": "05/01/2024",
                            },
                            "type": "Input",
                          },
                          {
                            "key": null,
                            "props": {
                              "name": "erc20-token-revocation-expiry_time",
                              "placeholder": "HH:MM:SS",
                              "type": "text",
                              "value": "00:00:00",
                            },
                            "type": "Input",
                          },
                          {
                            "key": null,
                            "props": {
                              "alignment": "center",
                              "children": {
                                "key": null,
                                "props": {
                                  "alignment": "center",
                                  "children": "UTC",
                                },
                                "type": "Text",
                              },
                              "direction": "vertical",
                            },
                            "type": "Box",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "children": [
                      null,
                      null,
                    ],
                  },
                  "type": "Box",
                },
              ],
              "direction": "vertical",
            },
            "type": "Box",
          },
        ],
      },
      "type": "Section",
    },
  },
  "type": "Box",
}
`);
    });
  });
});
