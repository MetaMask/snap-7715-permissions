import { describe, expect, it } from '@jest/globals';

import { TimePeriod } from '../../../src/core/types';
import { createConfirmationContent } from '../../../src/permissions/erc20TokenPeriodic/content';
import type {
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
} from '../../../src/permissions/erc20TokenPeriodic/types';
import { TIME_PERIOD_TO_SECONDS } from '../../../src/utils/time';

const tokenDecimals = 6;

const mockContext: Erc20TokenPeriodicContext = {
  expiry: {
    timestamp: 1714521600, // 05/01/2024
  },
  isAdjustmentAllowed: true,
  justification: 'Permission to do periodic ERC20 token transfers',
  accountAddressCaip10: `eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`,
  tokenAddressCaip19: `eip155:1/erc20:0xA0b86a33E6417efb4e0Ba2b1e4E6FE87bbEf2B0F`,
  tokenMetadata: {
    symbol: 'USDC',
    decimals: tokenDecimals,
    iconDataBase64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  permissionDetails: {
    periodAmount: '100',
    periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]),
    startTime: 499161600, // 10/26/1985
  },
};

const mockMetadata: Erc20TokenPeriodicMetadata = {
  validationErrors: {},
};

describe('erc20TokenPeriodic:content', () => {
  describe('createConfirmationContent()', () => {
    it('should render content with ERC20 token details', async () => {
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
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                        {
                          "key": null,
                          "props": {
                            "alt": "USDC",
                            "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                          },
                          "type": "Image",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": "100",
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
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Frequency",
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
                            "children": "Daily",
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
            "props": {},
            "type": "Divider",
          },
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                            "children": "10/26/1985, 8:00:00 AM",
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
                                      "children": "The expiry date of the permission",
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
                            "children": "5/1/2024, 12:00:00 AM",
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
        ],
      },
      "type": "Section",
    },
  },
  "type": "Box",
}
`);
    });

    it('should render content with validation errors', async () => {
      const contextWithErrors = {
        ...mockContext,
        permissionDetails: {
          ...mockContext.permissionDetails,
          periodAmount: 'invalid',
        },
      };

      const metadataWithErrors: Erc20TokenPeriodicMetadata = {
        validationErrors: {
          periodAmountError: 'Invalid Period amount',
        },
      };

      const content = await createConfirmationContent({
        context: contextWithErrors,
        metadata: metadataWithErrors,
      });

      expect(content).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
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
                      "alignment": "space-between",
                      "children": [
                        {
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
                        {
                          "key": null,
                          "props": {
                            "alt": "USDC",
                            "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                          },
                          "type": "Image",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": "invalid",
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
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Frequency",
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
                            "children": "Daily",
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
            "props": {},
            "type": "Divider",
          },
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                            "children": "10/26/1985, 8:00:00 AM",
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
                                      "children": "The expiry date of the permission",
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
                            "children": "5/1/2024, 12:00:00 AM",
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
        ],
      },
      "type": "Section",
    },
  },
  "type": "Box",
}
`);
    });

    it('should render content with weekly period', async () => {
      const weeklyContext = {
        ...mockContext,
        permissionDetails: {
          ...mockContext.permissionDetails,
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY]),
        },
      };

      const content = await createConfirmationContent({
        context: weeklyContext,
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
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                        {
                          "key": null,
                          "props": {
                            "alt": "USDC",
                            "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                          },
                          "type": "Image",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": "100",
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
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Frequency",
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
                            "children": "Weekly",
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
            "props": {},
            "type": "Divider",
          },
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                            "children": "10/26/1985, 8:00:00 AM",
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
                                      "children": "The expiry date of the permission",
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
                            "children": "5/1/2024, 12:00:00 AM",
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
        ],
      },
      "type": "Section",
    },
  },
  "type": "Box",
}
`);
    });

    it('should render content without token icon', async () => {
      const contextWithoutIcon = {
        ...mockContext,
        tokenMetadata: {
          ...mockContext.tokenMetadata,
          iconDataBase64: null,
        },
      };

      const content = await createConfirmationContent({
        context: contextWithoutIcon,
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
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                            "children": "100",
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
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Frequency",
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
                            "children": "Daily",
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
            "props": {},
            "type": "Divider",
          },
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                            "children": "10/26/1985, 8:00:00 AM",
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
                                      "children": "The expiry date of the permission",
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
                            "children": "5/1/2024, 12:00:00 AM",
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
        ],
      },
      "type": "Section",
    },
  },
  "type": "Box",
}
`);
    });

    it('should handle different chain IDs correctly', async () => {
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
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                        {
                          "key": null,
                          "props": {
                            "alt": "USDC",
                            "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                          },
                          "type": "Image",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": "100",
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
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Frequency",
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
                            "children": "Daily",
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
            "props": {},
            "type": "Divider",
          },
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                            "children": "10/26/1985, 8:00:00 AM",
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
                                      "children": "The expiry date of the permission",
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
                            "children": "5/1/2024, 12:00:00 AM",
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
        ],
      },
      "type": "Section",
    },
  },
  "type": "Box",
}
`);
    });

    it('should render content with multiple validation errors', async () => {
      const metadataWithMultipleErrors: Erc20TokenPeriodicMetadata = {
        validationErrors: {
          periodAmountError: 'Invalid period amount',
          periodDurationError: 'Invalid period duration',
          startTimeError: 'Invalid start time',
          expiryError: 'Invalid expiry',
        },
      };

      const content = await createConfirmationContent({
        context: mockContext,
        metadata: metadataWithMultipleErrors,
      });

      expect(content).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
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
                      "alignment": "space-between",
                      "children": [
                        {
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
                        {
                          "key": null,
                          "props": {
                            "alt": "USDC",
                            "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                          },
                          "type": "Image",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": "100",
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
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Frequency",
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
                            "children": "Daily",
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
            "props": {},
            "type": "Divider",
          },
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                            "children": "10/26/1985, 8:00:00 AM",
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
                                      "children": "The expiry date of the permission",
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
                            "children": "5/1/2024, 12:00:00 AM",
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
        ],
      },
      "type": "Section",
    },
  },
  "type": "Box",
}
`);
    });

    it('should render with expanded justification', async () => {
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
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                        {
                          "key": null,
                          "props": {
                            "alt": "USDC",
                            "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                          },
                          "type": "Image",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": "100",
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
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Frequency",
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
                            "children": "Daily",
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
            "props": {},
            "type": "Divider",
          },
          [
            {
              "key": null,
              "props": {
                "alignment": "space-between",
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
                            "children": "10/26/1985, 8:00:00 AM",
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
                                      "children": "The expiry date of the permission",
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
                            "children": "5/1/2024, 12:00:00 AM",
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
