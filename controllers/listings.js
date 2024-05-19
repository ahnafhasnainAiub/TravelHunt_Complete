const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding'); //Mapbox GeoCoding
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
 };

//Define the function to search listings by country
// module.exports.searchListingsByCountry = async (req, res) => {
//   const { country, location } = req.query;
//   let listings;

//   if (country) {
//       // If there's a country query parameter, perform a search by country
//       listings = await Listing.find(
//       { 
//           country: { $regex: new RegExp(country, 'i') }
//       });
//   } else {
//       // If no country query parameter, return all listings
//       listings = await Listing.find({});
//   }

//   // Render the index template with the search results
//   res.render("listings/index.ejs", { allListings: listings, searchTerm: country });
// };

//Searching Listings
module.exports.searchListings = async (req, res) => {
  const { query, category } = req.query;
  let listings;

  if (!query) {

        // If no query, return all listings
      listings = await Listing.find({});
  }  if(category){
    listings = await Listing.find({ category: category});
  } else {
     // If there's a query, search for listings that match either country or location
     const regexQuery = { $regex: new RegExp(query, 'i') };
     listings = await Listing.find({
         $or: [
             { country: regexQuery },
             { location: regexQuery }
         ]
     });
  }
  // if(category){
  //   listings = await Listing.find({ category: category});
  // } 

  // Render the index template with the search results
  res.render("listings/index.ejs", { allListings: listings, searchTerm: query });
};



 module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
 };

 // Show All
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing  = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: {
          path: "author",
        },
     })
     .populate("owner");
    //using flash for error mssg show
    if(!listing){
      req.flash("error","Listing you reqested for does not exist!");
      res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", {listing});
 };


 //Create Lsiting
 module.exports.createListing = async (req, res, next) => {
    
  let response = await geocodingClient
  .forwardGeocode({
    query: req.body.listing.location,
    limit: 1,
  })
    .send();
    
    let url = req.file.path;
    let filename = req.file.filename;
  
    const newListings = new Listing(req.body.listing);
    newListings.owner = req.user._id;
    newListings.image = { url, filename };

    newListings.geometry = response.body.features[0].geometry;

    let savedListing = await newListings.save();
    console.log(savedListing);
    
    req.flash("success", "New Listing Created!!"); //session-flash
    res.redirect("/listings");
};

//Edit Listing
module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    const listing  = await Listing.findById(id);
    //using flash for error mssg show
    if(!listing){
    req.flash("error","Listing you reqested for does not exist!");
    res.redirect("/listings");
  }
    
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

//Delete Listing
module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListings = await Listing.findByIdAndDelete(id);
    console.log(deletedListings);
    req.flash("success", "Listing Deleted!!"); //session-flash
    res.redirect("/listings");
};

//Update Listing
module.exports.updateListing = async (req, res) => {
     let { id } = req.params;
     let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
     
     if( typeof req.file !== "undefined" )
     {
       let url = req.file.path;
       let filename = req.file.filename;
       listing.image = { url, filename };
       await listing.save();
     }
     
     req.flash("success", "Listing Updated"); //session-flash
     res.redirect("/listings");
};