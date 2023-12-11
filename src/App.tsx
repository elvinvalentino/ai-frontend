/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import Swal from 'sweetalert2';
import { Button, Collapse, Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import {
  RcFile,
  UploadChangeParam,
  UploadFile,
  UploadProps,
} from 'antd/es/upload';
import { useState } from 'react';
import { getBase64 } from './utils/getBase64';
import TextArea from 'antd/es/input/TextArea';
import axios from 'axios';
import Title from 'antd/es/typography/Title';
import { useMediaQuery } from 'react-responsive';

const DISEASE_DESCRIPTIONS: Record<string, any> = {
  'Acne or Rosacea': {
    name: 'Acne and Rosacea',
    description:
      'Acne and Rosacea are common skin conditions that affect the appearance of the skin, causing various symptoms such as redness, pimples, and inflammation.',
    causes: [
      'Hormonal changes',
      'Excess oil production',
      'Bacterial overgrowth',
      'Buildup of dead skin cells',
      'Genetics',
      'Certain medications',
      'Dietary factors',
      'Abnormalities in blood vessels',
      'Overactive immune system',
    ],
    solutions: [
      'Topical creams and gels',
      'Oral medications',
      'Lifestyle changes',
      'Sun protection',
      'Avoidance of triggers (e.g., spicy foods, alcohol)',
      'Proper skincare routine',
      'Stress management',
      'Gentle skincare practices',
    ],
  },
  'Malignant Lesions': {
    name: 'Malignant Lesions',
    description:
      'Malignant lesions refer to cancerous growths on the skin. These can manifest as moles, tumors, or other abnormalities, and they have the potential to spread to other parts of the body.',
    causes: [
      'Genetic mutations',
      'Exposure to UV radiation',
      'Exposure to certain chemicals',
      'Family history of skin cancer',
    ],
    solutions: [
      'Surgery',
      'Chemotherapy',
      'Radiation therapy',
      'Immunotherapy',
      'Early detection and monitoring',
    ],
  },
  'Psoriasis or Lichen Planus': {
    name: 'Psoriasis or Lichen Planus',
    description:
      'Psoriasis and Lichen Planus are chronic inflammatory skin conditions. Psoriasis is characterized by red, scaly patches, while Lichen Planus presents as itchy, flat-topped bumps.',
    causes: [
      'Immune system dysfunction',
      'Genetics',
      'Environmental factors',
      'Stress',
    ],
    solutions: [
      'Topical treatments',
      'Phototherapy',
      'Systemic medications',
      'Lifestyle changes',
      'Stress management',
      'Avoidance of triggers',
    ],
  },
};

function App() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [file, setFile] = useState<RcFile>();
  const [text, setText] = useState<string>();
  const [disease, setDisease] = useState<{
    class: string;
    confidence: number;
  } | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
  const isHideSmallTitle = useMediaQuery({ query: '(max-width: 1300px)' });
  const isHideCredit = useMediaQuery({ query: '(max-width: 820px)' });

  const handleChange: UploadProps['onChange'] = (
    info: UploadChangeParam<UploadFile>
  ) => {
    console.log(info);

    // if (info.file.status === 'uploading') {
    //   setLoading(true);
    //   return;
    // }
    // if (info.file.status === 'done') {
    // }
    setFile(info.file.originFileObj as RcFile);
    // Get this url from response in real world.
    getBase64(info.file.originFileObj as RcFile, url => {
      setLoading(false);
      setImageUrl(url);
    });
  };

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload the photo of your skin</div>
    </div>
  );

  const onSubmit = async () => {
    if (!text) return;
    const trimmedString = text.trim();

    // Use a regular expression to split the string into words
    const words = trimmedString.split(/\s+/);

    // Return the count of words
    const wordCount = words.length;
    if (wordCount < 5) {
      return Swal.fire({
        icon: 'error',
        title: 'Input Error',
        text: 'Please describe your symptoms in at least 5 words.',
      });
    }

    setDisease(null);
    setIsPredicting(true);

    const formData = new FormData();
    formData.append('image', file as Blob);
    formData.append('text', text as string);

    const { data } = await axios.post(
      'https://transcendent.my.id/predict',
      formData,
      {
        headers: {
          'content-type': 'multipart/form-data',
        },
      }
    );

    const isNotValidImage = (data as any[]).every(v => v.confidence < 0.5);
    if (isNotValidImage) {
      setIsPredicting(false);

      return Swal.fire({
        icon: 'error',
        title: 'Input Error',
        text: 'Please upload different image or describe more about your symptoms',
      });
    }

    const predictedDisease = (data as any[]).reduce((a: any, b: any) => {
      if (a.confidence > b.confidence) return a;
      return b;
    });

    setDisease(predictedDisease);
    setIsPredicting(false);
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="static"
          className="mb-5"
          style={{ backgroundColor: '#545454' }}
        >
          <Toolbar>
            <Typography
              variant="h5"
              component="div"
              sx={{ display: 'flex', alignItems: 'flex-end', flexGrow: 1 }}
            >
              Skin Disease Diagnosis
              {!isHideSmallTitle && (
                <Typography variant="body1" sx={{ marginLeft: '0.5rem' }}>
                  (Acne or Rosacea, Malignant Lesions, Psoriasis or Lichen
                  Planus)
                </Typography>
              )}
            </Typography>
            {!isHideCredit && (
              <Typography variant="body2" component="div">
                Made with 💛 by Kelompok 1 (Transcendent) - Universitas
                Internasional Batam
              </Typography>
            )}
          </Toolbar>
        </AppBar>
        <div
          style={{ display: 'flex', justifyContent: 'center' }}
          className="mb-3"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: isTabletOrMobile ? 'column' : 'row',
              width: '80%',
            }}
          >
            <div
              style={{
                flex: 0,
                ...(isTabletOrMobile && {
                  marginBottom: '1rem',
                  alignSelf: 'center',
                }),
              }}
            >
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                action="https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188"
                beforeUpload={beforeUpload}
                onChange={handleChange}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <TextArea
                rows={4}
                placeholder="Describe your skin disease symptoms"
                className="mb-2"
                onChange={e => setText(e.target.value)}
                value={text}
                style={{ flex: 1, fontSize: '2rem' }}
              />
              <Button
                // className="bg-primary text-white w-100"
                onClick={onSubmit}
                disabled={!file || !text}
                type="primary"
                className="w-100"
                loading={isPredicting}
              >
                {isPredicting ? 'Predicting...' : 'Predict'}
              </Button>
            </div>
          </div>
        </div>
        {disease && (
          <div className="d-flex justify-content-center">
            <div style={{ width: '80%' }}>
              <Title level={3}>Prediction result:</Title>
              <div style={{ fontSize: '2rem' }}>
                You have <b>{disease.class}</b>
              </div>
              <div style={{ fontSize: '1.2rem' }} className="mb-4">
                Certainty: {Math.round(disease.confidence * 100)}%
              </div>
              <Collapse
                size="large"
                items={[
                  {
                    key: '1',
                    label: `What is ${disease.class}?`,
                    children: (
                      <div>
                        {
                          DISEASE_DESCRIPTIONS[disease.class as string]
                            .description
                        }
                      </div>
                    ),
                  },
                ]}
              />
              <Collapse
                size="large"
                items={[
                  {
                    key: '2',
                    label: ` What might cause ${disease.class}?`,
                    children: (
                      <ul>
                        {DISEASE_DESCRIPTIONS[
                          disease.class as string
                        ].causes.map((cause: any) => (
                          <li>{cause}</li>
                        ))}
                      </ul>
                    ),
                  },
                ]}
              />
              <Collapse
                size="large"
                className="mb-5"
                items={[
                  {
                    key: '3',
                    label: ` What are the treatments for ${disease.class}?`,
                    children: (
                      <ul>
                        {DISEASE_DESCRIPTIONS[
                          disease.class as string
                        ].solutions.map((solution: any) => (
                          <li>{solution}</li>
                        ))}
                      </ul>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Box>
    </>
  );
}

export default App;
