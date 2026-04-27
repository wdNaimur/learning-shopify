import { useFetcher } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  
  if (formData.get("actionType") === "GET_PRODUCTS") {
    const response = await admin.graphql(
      `#graphql
      query getProducts {
        products(first: 10) {
          edges {
            node {
              id
              title
              status
              totalInventory
              featuredImage {
                url
              }
            }
          }
        }
      }`
    );
    const responseJson = await response.json();
    return { products: responseJson.data.products.edges };
  }

  return null;
};

export default function Index() {
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
  const products = fetcher.data?.products;

  const getProducts = () => {
    fetcher.submit({ actionType: "GET_PRODUCTS" }, { method: "POST" });
  };

  return (
    <s-page heading="Product Management">
      <s-layout>
        <s-layout-section>
          <s-card>
            <s-box padding="base">
              <s-button 
                onClick={getProducts} 
                variant="primary"
                {...(isLoading ? { loading: true } : {})}
              >
                Fetch Products
              </s-button>
            </s-box>
            
            <s-divider />
            
            <s-box padding="none">
              {!products ? (
                <s-box padding="loose" textAlign="center">
                  <s-text variant="bodyMd" color="subdued">
                    Click Fetch Products to view your store inventory.
                  </s-text>
                </s-box>  
              ) : (
                <s-table>
                  <s-table-header-row>
                    <s-table-header>Product</s-table-header>
                    <s-table-header>Status</s-table-header>
                    <s-table-header format="numeric">Inventory</s-table-header>
                  </s-table-header-row>
                  <s-table-body>
                    {products.map(({ node }) => (
                      <s-table-row key={node.id}>
                        <s-table-cell>
                          <s-stack direction="inline" gap="small" align="center">
                            {node.featuredImage?.url && (
                              <img
                                src={node.featuredImage.url}
                                alt=""
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 4,
                                  objectFit: "cover",
                                }}
                              />
                            )}
                            <s-text variant="bodyMd" fontWeight="bold">
                              {node.title}
                            </s-text>
                          </s-stack>
                        </s-table-cell>
                        <s-table-cell>
                          <s-badge
                            tone={node.status === "ACTIVE" ? "success" : "attention"}
                          >
                            {node.status}
                          </s-badge>
                        </s-table-cell>
                        <s-table-cell>{node.totalInventory} in stock</s-table-cell>
                      </s-table-row>
                    ))}
                  </s-table-body>
                </s-table>
              )}
            </s-box>
          </s-card>
        </s-layout-section>

        <s-layout-section variant="one-third">
          <s-card heading="Quick Links">
            <s-box padding="base">
              <s-button url="shopify://admin/products" target="_blank" fullWidth>Open Products in Admin</s-button>
            </s-box>
          </s-card>
        </s-layout-section>
      </s-layout>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
