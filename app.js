document.addEventListener('DOMContentLoaded', function() {
    fetch('EtsyListingsDownload.csv')
        .then(response => response.text())
        .then(data => {
            Papa.parse(data, {
                header: true,
                complete: function(results) {
                    createListingPages(results.data);
                }
            });
        });

    function createListingPages(listings) {
        const container = document.getElementById('listings-container');
        listings.forEach((listing) => {
            const listingDiv = document.createElement('div');
            listingDiv.classList.add('listing');

            listingDiv.innerHTML = `
                <h2>${listing.title}</h2>
                <img src="${listing.image_url}" alt="${listing.title}" width="200">
                <p>${listing.description}</p>
                <p>Price: $${listing.price}</p>
            `;
            container.appendChild(listingDiv);
        });
    }
});
