import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import { TimePeriod } from '../../../src/core/types';
import { createConfirmationContent } from '../../../src/permissions/nativeTokenPeriodic/content';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
} from '../../../src/permissions/nativeTokenPeriodic/types';
import { TIME_PERIOD_TO_SECONDS } from '../../../src/utils/time';
import { parseUnits } from '../../../src/utils/value';

const mockContext: NativeTokenPeriodicContext = {
  expiry: '05/01/2024',
  isAdjustmentAllowed: true,
  justification: 'Permission to do periodic native token transfers',
  accountDetails: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: bigIntToHex(parseUnits({ formatted: '10', decimals: 18 })),
    balanceFormattedAsCurrency: '$🐊10.00',
  },
  tokenMetadata: {
    symbol: 'ETH',
    decimals: 18,
    iconDataBase64: null,
  },
  permissionDetails: {
    periodAmount: '1',
    periodType: TimePeriod.DAILY,
    periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]).toString(),
    startTime: '10/26/1985',
  },
};

const mockMetadata: NativeTokenPeriodicMetadata = {
  validationErrors: {},
};

describe('nativeTokenPeriodic:content', () => {
  describe('createConfirmationContent()', () => {
    it('should render content with all permission details', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
        isJustificationCollapsed: true,
        origin: 'https://example.com',
        chainId: 1,
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
                [
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
                                  "children": "Recipient",
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
                                      "children": "The site requesting the permission",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "https://example.com",
                                },
                                "type": "Text",
                              },
                            ],
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
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Network",
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
                                      "children": "The network on which the permission is being requested",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "Ethereum Mainnet",
                                },
                                "type": "Text",
                              },
                            ],
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
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Token",
                                },
                                "type": "Text",
                              },
                              null,
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "ETH",
                                },
                                "type": "Text",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                      ],
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                ],
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
                                "children": "Reason",
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
                                    "children": "Reason given by the recipient for requesting this token stream allowance.",
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Permission to do ...",
                                    "color": "muted",
                                  },
                                  "type": "Text",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "alignment": "end",
                                    "children": {
                                      "key": null,
                                      "props": {
                                        "children": "Show",
                                        "name": "show-more-justification",
                                      },
                                      "type": "Button",
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
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
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
                        "alignment": "space-between",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Transfer from",
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
                                        "children": "The account that the token transfers come from.",
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
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "address": "eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                                    "size": "sm",
                                  },
                                  "type": "Avatar",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Gator Account",
                                    "color": "default",
                                  },
                                  "type": "Text",
                                },
                              ],
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
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "$🐊10.00",
                              "color": "muted",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "10",
                                "available",
                              ],
                              "color": "alternative",
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Start Time",
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
                                        "children": "The time at which the first period begins",
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
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-start-date",
                                "type": "text",
                                "value": "10/26/1985",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                          ],
                        },
                        "type": "Field",
                      },
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "children": [
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
                                    "children": "Amount",
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
                                        "children": "The amount of tokens granted during each period",
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
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-period-amount",
                                "type": "number",
                                "value": "1",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                          ],
                        },
                        "type": "Field",
                      },
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "children": [
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
                                    "children": "Period duration",
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
                                        "children": "The duration of the period",
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
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": "Daily",
                                  "props": {
                                    "children": "Daily",
                                    "value": "Daily",
                                  },
                                  "type": "Option",
                                },
                                {
                                  "key": "Weekly",
                                  "props": {
                                    "children": "Weekly",
                                    "value": "Weekly",
                                  },
                                  "type": "Option",
                                },
                                {
                                  "key": "Other",
                                  "props": {
                                    "children": "Other",
                                    "value": "Other",
                                  },
                                  "type": "Option",
                                },
                              ],
                              "name": "native-token-periodic-period-type",
                              "value": "Daily",
                            },
                            "type": "Dropdown",
                          },
                        },
                        "type": "Field",
                      },
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
                null,
              ],
            },
            "type": "Section",
          },
          {
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
                          "children": {
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
                                null,
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
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-expiry",
                                "type": "text",
                                "value": "05/01/2024",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                          ],
                        },
                        "type": "Field",
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
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
    });

    it('should render the period duration if the period type is "Other"', async () => {
      const context: NativeTokenPeriodicContext = {
        ...mockContext,
        permissionDetails: {
          ...mockContext.permissionDetails,
          periodType: 'Other',
        },
      };
      const content = await createConfirmationContent({
        context,
        metadata: mockMetadata,
        isJustificationCollapsed: true,
        origin: 'https://example.com',
        chainId: 1,
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
                [
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
                                  "children": "Recipient",
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
                                      "children": "The site requesting the permission",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "https://example.com",
                                },
                                "type": "Text",
                              },
                            ],
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
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Network",
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
                                      "children": "The network on which the permission is being requested",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "Ethereum Mainnet",
                                },
                                "type": "Text",
                              },
                            ],
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
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Token",
                                },
                                "type": "Text",
                              },
                              null,
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "ETH",
                                },
                                "type": "Text",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                      ],
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                ],
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
                                "children": "Reason",
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
                                    "children": "Reason given by the recipient for requesting this token stream allowance.",
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Permission to do ...",
                                    "color": "muted",
                                  },
                                  "type": "Text",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "alignment": "end",
                                    "children": {
                                      "key": null,
                                      "props": {
                                        "children": "Show",
                                        "name": "show-more-justification",
                                      },
                                      "type": "Button",
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
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                    ],
                    "direction": "horizontal",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
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
                        "alignment": "space-between",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Transfer from",
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
                                        "children": "The account that the token transfers come from.",
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
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "address": "eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                                    "size": "sm",
                                  },
                                  "type": "Avatar",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Gator Account",
                                    "color": "default",
                                  },
                                  "type": "Text",
                                },
                              ],
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
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "$🐊10.00",
                              "color": "muted",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "10",
                                "available",
                              ],
                              "color": "alternative",
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
            },
            "type": "Section",
          },
          {
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Start Time",
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
                                        "children": "The time at which the first period begins",
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
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-start-date",
                                "type": "text",
                                "value": "10/26/1985",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                          ],
                        },
                        "type": "Field",
                      },
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "children": [
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
                                    "children": "Amount",
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
                                        "children": "The amount of tokens granted during each period",
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
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-period-amount",
                                "type": "number",
                                "value": "1",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                          ],
                        },
                        "type": "Field",
                      },
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "children": [
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
                                    "children": "Period duration",
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
                                        "children": "The duration of the period",
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
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": "Daily",
                                  "props": {
                                    "children": "Daily",
                                    "value": "Daily",
                                  },
                                  "type": "Option",
                                },
                                {
                                  "key": "Weekly",
                                  "props": {
                                    "children": "Weekly",
                                    "value": "Weekly",
                                  },
                                  "type": "Option",
                                },
                                {
                                  "key": "Other",
                                  "props": {
                                    "children": "Other",
                                    "value": "Other",
                                  },
                                  "type": "Option",
                                },
                              ],
                              "name": "native-token-periodic-period-type",
                              "value": "Other",
                            },
                            "type": "Dropdown",
                          },
                        },
                        "type": "Field",
                      },
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
                {
                  "key": null,
                  "props": {
                    "children": [
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
                                    "children": "Duration (seconds)",
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
                                        "children": "The length of each period in seconds",
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
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-period-duration",
                                "type": "number",
                                "value": "86400",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                          ],
                        },
                        "type": "Field",
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
          {
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
                          "children": {
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
                                null,
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
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-expiry",
                                "type": "text",
                                "value": "05/01/2024",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "children": null,
                              },
                              "type": "Box",
                            },
                          ],
                        },
                        "type": "Field",
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
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
    });
  });
});
