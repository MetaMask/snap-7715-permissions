import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import { TimePeriod } from '../../../src/core/types';
import { createConfirmationContent } from '../../../src/permissions/erc20TokenStream/content';
import type {
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
} from '../../../src/permissions/erc20TokenStream/types';
import { parseUnits } from '../../../src/utils/value';

const tokenDecimals = 10;

const mockContext: Erc20TokenStreamContext = {
  expiry: '05/01/2024',
  isAdjustmentAllowed: true,
  justification: 'Permission to stream ERC20 tokens',
  accountDetails: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: bigIntToHex(
      parseUnits({ formatted: '10', decimals: tokenDecimals }),
    ),
    balanceFormattedAsCurrency: '$🐊10.00',
  },
  tokenMetadata: {
    decimals: tokenDecimals,
    symbol: 'USDC',
    iconDataBase64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  },
  permissionDetails: {
    initialAmount: '1',
    maxAmount: '10',
    timePeriod: TimePeriod.WEEKLY,
    startTime: '10/26/1985',
    amountPerPeriod: '302400',
  },
};

const mockMetadata: Erc20TokenStreamMetadata = {
  amountPerSecond: '0.5',
  validationErrors: {},
};

describe('erc20TokenStream:content', () => {
  describe('createConfirmationContent()', () => {
    it('should render content with all permission details', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(content).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": [
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
                                "children": "Stream from",
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
                                    "children": "The account that the token stream comes from.",
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
            [
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
                                  "children": "Stream Amount",
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
                                      "children": "The amount of tokens that can be streamed per period.",
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
                              "children": {
                                "key": null,
                                "props": {
                                  "alt": "USDC",
                                  "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                                },
                                "type": "Image",
                              },
                            },
                            "type": "Box",
                          },
                          {
                            "key": null,
                            "props": {
                              "name": "erc20-token-stream-amount-per-period",
                              "type": "number",
                              "value": "302400",
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
                                  "children": "Stream Period",
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
                                      "children": "The period of the stream.",
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
                                "key": "Monthly",
                                "props": {
                                  "children": "Monthly",
                                  "value": "Monthly",
                                },
                                "type": "Option",
                              },
                            ],
                            "name": "erc20-token-stream-time-period",
                            "value": "Weekly",
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
            ],
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
                                "children": "Stream rate",
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
                                    "children": "The amount of tokens to stream per second.",
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
                            "children": {
                              "key": null,
                              "props": {
                                "alt": "USDC",
                                "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                              },
                              "type": "Image",
                            },
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "disabled": true,
                            "name": "stream-rate",
                            "type": "text",
                            "value": "0.5 USDC/sec",
                          },
                          "type": "Input",
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
                                "children": "Initial Amount",
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
                                    "children": "The initial amount of tokens that can be streamed.",
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
                            "children": {
                              "key": null,
                              "props": {
                                "alt": "USDC",
                                "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                              },
                              "type": "Image",
                            },
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "name": "erc20-token-stream-initial-amount",
                            "type": "number",
                            "value": "1",
                          },
                          "type": "Input",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "color": "primary",
                                    "name": "close",
                                    "size": "md",
                                  },
                                  "type": "Icon",
                                },
                                "name": "erc20-token-stream-initial-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
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
                                "children": "Max Amount",
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
                                    "children": "The maximum amount of tokens that can be streamed.",
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
                            "children": {
                              "key": null,
                              "props": {
                                "alt": "USDC",
                                "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                              },
                              "type": "Image",
                            },
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "name": "erc20-token-stream-max-amount",
                            "type": "number",
                            "value": "10",
                          },
                          "type": "Input",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "color": "primary",
                                    "name": "close",
                                    "size": "md",
                                  },
                                  "type": "Icon",
                                },
                                "name": "erc20-token-stream-max-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
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
                                    "children": "The start time of the stream.",
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
                            "name": "erc20-token-stream-start-time",
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
                                    "children": "The expiry date of the permission.",
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
                            "name": "erc20-token-stream-expiry",
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
  },
  "type": "Box",
}
`);
    });

    it('should render content with validation errors', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: {
          ...mockMetadata,
          validationErrors: {
            initialAmountError: 'Invalid initial amount',
            maxAmountError: 'Invalid max amount',
            amountPerPeriodError: 'Invalid amount per period',
            startTimeError: 'Invalid start time',
            expiryError: 'Invalid expiry',
          },
        },
      });

      expect(content).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": [
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
                                "children": "Stream from",
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
                                    "children": "The account that the token stream comes from.",
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
            [
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
                                  "children": "Stream Amount",
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
                                      "children": "The amount of tokens that can be streamed per period.",
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
                              "children": {
                                "key": null,
                                "props": {
                                  "alt": "USDC",
                                  "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                                },
                                "type": "Image",
                              },
                            },
                            "type": "Box",
                          },
                          {
                            "key": null,
                            "props": {
                              "name": "erc20-token-stream-amount-per-period",
                              "type": "number",
                              "value": "302400",
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
                        "error": "Invalid amount per period",
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
                                  "children": "Stream Period",
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
                                      "children": "The period of the stream.",
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
                                "key": "Monthly",
                                "props": {
                                  "children": "Monthly",
                                  "value": "Monthly",
                                },
                                "type": "Option",
                              },
                            ],
                            "name": "erc20-token-stream-time-period",
                            "value": "Weekly",
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
            ],
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
                                "children": "Stream rate",
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
                                    "children": "The amount of tokens to stream per second.",
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
                            "children": {
                              "key": null,
                              "props": {
                                "alt": "USDC",
                                "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                              },
                              "type": "Image",
                            },
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "disabled": true,
                            "name": "stream-rate",
                            "type": "text",
                            "value": "0.5 USDC/sec",
                          },
                          "type": "Input",
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
                                "children": "Initial Amount",
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
                                    "children": "The initial amount of tokens that can be streamed.",
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
                            "children": {
                              "key": null,
                              "props": {
                                "alt": "USDC",
                                "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                              },
                              "type": "Image",
                            },
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "name": "erc20-token-stream-initial-amount",
                            "type": "number",
                            "value": "1",
                          },
                          "type": "Input",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "color": "primary",
                                    "name": "close",
                                    "size": "md",
                                  },
                                  "type": "Icon",
                                },
                                "name": "erc20-token-stream-initial-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
                          },
                          "type": "Box",
                        },
                      ],
                      "error": "Invalid initial amount",
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
                                "children": "Max Amount",
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
                                    "children": "The maximum amount of tokens that can be streamed.",
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
                            "children": {
                              "key": null,
                              "props": {
                                "alt": "USDC",
                                "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                              },
                              "type": "Image",
                            },
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "name": "erc20-token-stream-max-amount",
                            "type": "number",
                            "value": "10",
                          },
                          "type": "Input",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": {
                              "key": null,
                              "props": {
                                "children": {
                                  "key": null,
                                  "props": {
                                    "color": "primary",
                                    "name": "close",
                                    "size": "md",
                                  },
                                  "type": "Icon",
                                },
                                "name": "erc20-token-stream-max-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
                          },
                          "type": "Box",
                        },
                      ],
                      "error": "Invalid max amount",
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
                                    "children": "The start time of the stream.",
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
                            "name": "erc20-token-stream-start-time",
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
                      "error": "Invalid start time",
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
                                    "children": "The expiry date of the permission.",
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
                            "name": "erc20-token-stream-expiry",
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
                      "error": "Invalid expiry",
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
  },
  "type": "Box",
}
`);
    });
  });
});
