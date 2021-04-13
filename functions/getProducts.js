const sanityClient = require('@sanity/client');
const imageUrlBuilder = require('@sanity/image-url');
const blocksToHtml = require('@sanity/block-content-to-html');

// passing the env vars to Sanity.io
const sanity = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: true,
});

exports.handler = async () => {
  // this query asks for all products in order of title ascending
  const query = '*[_type=="product"] | order(title asc)';
  const products = await sanity.fetch(query).then((results) => {
    // then it iterates over each product
    const allProducts = results.map((product) => {
      // & assigns its properties to output

      // service stopped working after I added a product, it is throwing error here, presumably due to no slug being defined
      let slug = product.slug;
      let _id;
      if(slug)
        _id = product.slug.current;
      else
        _id = 'FOO';  

      const output = {
        //id: product.slug.current,
        id: _id,
        name: product.title,
        url: `${process.env.URL}/.netlify/functions/getProducts`,
        price: product.defaultProductVariant.price,
        description: product.blurb,
        // this is where we use the Sanity.io library to make the text HTML
        body: blocksToHtml({ blocks: product.body }),
      };

      // we want to make sure an image exists before we assign it
      const image =
        product.defaultProductVariant.images &&
        product.defaultProductVariant.images.length > 0
          ? product.defaultProductVariant.images[0].asset._ref
          : null;

      if (image) {
        // this is where we use the library to make a URL from the image records
        output.image = imageUrlBuilder(sanity).image(image).url();
      }
      return output;
    });
    // this log lets us see that we're getting the projects
    // we can delete this once we know it works
    console.log(allProducts);

    // now it will return all of the products and the properties requested
    return allProducts;
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(products),
  };
};