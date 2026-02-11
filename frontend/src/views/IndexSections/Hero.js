import React from "react";
import { Link } from "react-router-dom";

// reactstrap components
import { Button, Container, Row, Col } from "reactstrap";

import { Modal } from "reactstrap";

import heroImage from "assets/img/Coverpage/HomeCover.jpeg";

class Hero extends React.Component {
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
          {/* Hero for FREE version */}
          <section className="section section-hero section-shaped">
            {/* Background circles */}
            <div className="shape shape-style-1 shape-default">
              <span className="span-150" />
              <span className="span-50" />
              <span className="span-50" />
              <span className="span-75" />
              <span className="span-100" />
              <span className="span-75" />
              <span className="span-50" />
              <span className="span-100" />
              <span className="span-50" />
              <span className="span-100" />
            </div>
            <Container className="shape-container d-flex align-items-center py-lg">
              <div className="col px-0">
                <Row className="align-items-left justify-content-left">
                  <Col className="text-left" lg="6">
                    <p className="lead text-white">
                      <b style={{ fontSize: "2em", fontWeight: "bold" }}>
                        AI Inference Hub
                      </b>
                      <br />
                      Welcome to our AI Inference Hub, where the future meets
                      real-time intelligence. Our cutting-edge platform
                      harnesses the power of artificial intelligence to provide
                      lightning-fast, accurate, and scalable inference for your
                      data and models.
                    </p>

                    <Button
                      block
                      className="mb-3"
                      color="neutral"
                      type="button"
                      tag={Link}
                      to="/models"
                    >
                      View Models
                    </Button>
                    <Modal
                      className="modal-dialog-centered"
                      isOpen={this.state.defaultModal}
                      toggle={() => this.toggleModal("defaultModal")}
                    >
                      <div className="modal-header">
                        <h6 className="modal-title" id="modal-title-default">
                          Existing models
                        </h6>
                        <button
                          aria-label="Close"
                          className="close"
                          data-dismiss="modal"
                          type="button"
                          onClick={() => this.toggleModal("defaultModal")}
                        >
                          <span aria-hidden={true}>×</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p>List of models to be inserted here</p>
                      </div>
                      <div className="modal-footer">
                        <Button color="primary" type="button">
                          Explore more
                        </Button>
                        <Button
                          className="ml-auto"
                          color="link"
                          data-dismiss="modal"
                          type="button"
                          onClick={() => this.toggleModal("defaultModal")}
                        >
                          Close
                        </Button>
                      </div>
                    </Modal>
                  </Col>
                  <Col className="text-right" lg="6">
                    <img
                      src={heroImage}
                      alt="AI Inference"
                      className="ml-lg-3"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  </Col>
                </Row>
              </div>
            </Container>
            {/* SVG separator */}
            <div className="separator separator-bottom separator-skew zindex-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                version="1.1"
                viewBox="0 0 2560 100"
                x="0"
                y="0"
              >
                <polygon
                  className="fill-white"
                  points="2560 0 2560 100 0 100"
                />
              </svg>
            </div>
          </section>
        </div>
      </>
    );
  }
}

export default Hero;
