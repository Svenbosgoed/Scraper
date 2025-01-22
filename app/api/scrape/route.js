import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

export async function POST(request) {
  try {
    const { url } = await request.json();
    console.log('Scanning URL:', url);

    const axiosConfig = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    };

    const response = await axios.get(url, axiosConfig);
    const $ = cheerio.load(response.data);
    
    // Haal de website titel op
    const websiteTitle = $('title').text().trim() || 
                        $('meta[property="og:site_name"]').attr('content') ||
                        new URL(url).hostname;
    
    const products = [];
    
    // Uitgebreidere lijst van product selectors
    const productSelectors = [
      'div[class*="product"]',
      'div[class*="item"]',
      'article[class*="product"]',
      '.product-item',
      '.product-card',
      '.product-box',
      '[data-product]',
      'li[class*="product"]',
      '.grid-item',
      '.collection-item',
      '[class*="productCard"]',
      '[class*="product-card"]',
      '[class*="productTile"]',
      '[class*="product-tile"]',
      '.item',
      'article',
      '[itemtype*="Product"]'
    ];

    // Lijst van selectors om te negeren
    const ignoreSelectors = [
      'header',
      'footer',
      'nav',
      '#menu',
      '.menu',
      '.navigation',
      '.footer',
      '.cart',
      '#cart',
      '.checkout',
      '.customer-service',
      '.contact',
      '.opening-hours',
      '.filter',
      '.sorting',
      '.pagination',
      '.results-count'
    ];

    // Woorden die aangeven dat het geen product is
    const ignoreWords = [
      'producten',
      'artikelen',
      'resultaten',
      'items',
      'results',
      'filter',
      'sort',
      'menu',
      'service',
      'contact',
      'openingstijden',
      'opening hours'
    ];

    // Verwijder eerst alle menu/footer elementen
    $(ignoreSelectors.join(', ')).remove();

    // Functie om absolute URL te maken
    const makeAbsoluteUrl = (relativeUrl) => {
      if (!relativeUrl) return null;
      if (relativeUrl.startsWith('http')) return relativeUrl;
      if (relativeUrl.startsWith('//')) return `https:${relativeUrl}`;
      if (relativeUrl.startsWith('/')) return `${new URL(url).origin}${relativeUrl}`;
      return `${url.replace(/\/$/, '')}/${relativeUrl}`;
    };

    // Functie om afbeelding URL te vinden
    const findImageUrl = (element) => {
      // Zoek eerst normale src
      let imgUrl = element.find('img').first().attr('src');
      
      // Als geen src, probeer data-src
      if (!imgUrl) {
        imgUrl = element.find('img').first().attr('data-src');
      }
      
      // Als nog steeds geen URL, probeer andere data attributes
      if (!imgUrl) {
        const img = element.find('img').first();
        const attrs = img.get(0)?.attribs || {};
        for (const [key, value] of Object.entries(attrs)) {
          if (key.includes('src') && value) {
            imgUrl = value;
            break;
          }
        }
      }
      
      // Als nog steeds geen URL, zoek naar background-image
      if (!imgUrl) {
        const style = element.find('[style*="background-image"]').first().attr('style');
        const match = style?.match(/url\(['"]?(.*?)['"]?\)/);
        if (match) imgUrl = match[1];
      }

      return imgUrl ? makeAbsoluteUrl(imgUrl) : null;
    };

    // Zoek alle product elementen
    $(productSelectors.join(', ')).each((i, el) => {
      const element = $(el);
      
      // Skip als het element in een te negeren container zit
      if (element.parents(ignoreSelectors.join(', ')).length > 0) return;

      const title = element.find('[class*="title"], [class*="name"], h2, h3, h4, [itemprop="name"]')
        .first()
        .text()
        .trim();
        
      const price = element.find('[class*="price"], .price, [data-price], [itemprop="price"]')
        .first()
        .text()
        .trim();
        
      const image = findImageUrl(element);
      
      let link = element.find('a').first().attr('href');
      if (!link) {
        link = element.closest('a').attr('href');
      }

      // Check of het een geldig product is
      const containsIgnoreWord = ignoreWords.some(word => 
        title?.toLowerCase().includes(word.toLowerCase())
      );
      const looksLikeProductCount = /^\d+\s*(producten|artikelen|items|results)/i.test(title);

      if ((title || price) && 
          !containsIgnoreWord && 
          !looksLikeProductCount &&
          title?.length < 200) {
        
        products.push({
          title: title || 'Untitled Product',
          price: price || 'Price not found',
          image: image || null,
          link: makeAbsoluteUrl(link),
          html: element.html()
        });
      }
    });

    // Verwijder duplicaten op basis van titel
    const uniqueProducts = Array.from(new Map(
      products.map(product => [product.title, product])
    ).values());

    return NextResponse.json({
      websiteTitle,
      products,
      total: products.length
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape products' },
      { status: 500 }
    );
  }
}

// Nieuwe route voor het scrapen van een specifieke collectie
export async function PUT(request) {
  try {
    const { url } = await request.json();
    const products = [];
    
    // Gebruik bestaande scraping logica voor deze specifieke URL
    // ... bestaande product scraping code ...

    return NextResponse.json({ 
      products,
      total: products.length
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape collection' },
      { status: 500 }
    );
  }
} 