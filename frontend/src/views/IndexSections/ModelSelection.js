import React from "react";
import { Container, Row, Col } from "reactstrap";
import "assets/css/modelBoxes.css"; // Import a custom CSS file for styling
import classificationImage from "assets/img/brand/classification.png";
import defectdetectionImage from "assets/img/brand/defectdetection.png";
import ocrImage from "assets/img/brand/ocr.png";
import historyImage from "assets/img/brand/history.png";
import { Link } from "react-router-dom";

class ModelSelectionComponent extends React.Component {
  state = {};

  toggleModal = (state) => {
    this.setState({
      [state]: !this.state[state],
    });
  };

  render() {
    return (
      <>
        <div className="position-relative">
          <section className="section section-hero section-shaped">
            <Container className="custom-container d-flex align-items-center py-lg">
              <div className="col">
                <Row className="align-items-center justify-content-center">
                  {/* Background Box */}
                  <div className="background-box"></div> {/* Add this line */}
                  {/* Text */}
                  <Col className="text-left mb-4" lg="4">
                    <div className="model-selection-box">
                      <div className="model-selection-title">
                        <b style={{ fontSize: "2em", fontWeight: "bold" }}>
                          Model Selection
                        </b>
                      </div>
                      <div className="model-selection-description">
                        <div className="description-content">
                          We have a list of models that were provided by ARTC.
                          However, our application also has the feature of
                          uploading your own models.
                        </div>
                      </div>
                    </div>
                    <img
                      loading="lazy"
                      srcSet="https://cdn.builder.io/api/v1/image/assets/TEMP/d050234a-d9bd-42c3-bd94-53381531f79d?apiKey=fc9f92533c0d4de19d81fa67c71d3741&width=100"
                      className="aspect-[4] object-cover object-center w-[572px] overflow-hidden max-w-full grow max-md:mt-10 position-absolute"
                    />
                  </Col>
                  {/* Boxes */}
                  <Col lg="8">
                    <Row>
                      {this.renderBoxes().map((box, index) => (
                        <Col
                          key={index}
                          lg="6"
                          md="6"
                          sm="12"
                          className={ `${index % 2 == 0 ? "move-down" : "move-up"}` }
                        >
                          {this.renderBox(box)}
                        </Col>
                      ))}
                    </Row>
                  </Col>
                </Row>
              </div>
            </Container>
          </section>
        </div>
      </>
    );
  }

  renderBox(box) {
    return (
      <Link to={box.linkTo} className="custom-box-container">
        <div className="border shadow-md bg-white flex flex-col items-center p-5 rounded-xl border-gray-200 custom-box">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <img
              loading="lazy"
              srcSet={box.imageSrc}
              className="object-cover object-center w-16 h-16 overflow-hidden rounded-full custom-image"
              alt={box.title}
            />
          </div>
          <h2 className="text-black text-lg mb-2 text-sm text-center">
            {box.title}
          </h2>
          <p className="text-gray-600 text-left leading-relaxed text-xs text-center">
            {box.description}
          </p>
        </div>
      </Link>
    );
  }

  renderBoxes() {
    // Define an array of box data
    const boxes = [
      {
        title: "Computer Vision",
        description: "Defect detection for quality control with Segmentation and Object Detection",
        imageSrc: defectdetectionImage,
        linkTo: "/Models",
      },
      {
        title: "Analytics",
        description: "Display information and charts about models",
        imageSrc: classificationImage,
        linkTo: "/Analytics",
      },
      {
        title: "OCR",
        description:
          "Converts text within images and documents into machine-readable text",
        imageSrc: ocrImage,
        linkTo: "/OCR",
      },
      {
        title: "History",
        description: "Access and manage the log of past predictions made",
        imageSrc: historyImage,
        linkTo: "/History",
      },
    ];

    return boxes;
  }
}

export default ModelSelectionComponent;
