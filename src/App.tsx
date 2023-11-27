/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import { Button, Upload, message } from 'antd';
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
  const [disease, setDisease] = useState<string>('');
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

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
    setDisease('');
    setIsPredicting(true);

    const formData = new FormData();
    formData.append('image', file as Blob);
    formData.append('text', text as string);

    const { data } = await axios.post(
      'http://127.0.0.1:5000/predict',
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

      return message.error(
        'Please upload different image or describe more about your symptom'
      );
    }

    const predictedDisease = (data as any[]).reduce((a: any, b: any) => {
      if (a.confidence > b.confidence) return a;
      return b;
    });

    setDisease(predictedDisease.class);
    setIsPredicting(false);
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" className="mb-5">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Skin Prediction
            </Typography>
          </Toolbar>
        </AppBar>
        <div
          style={{ display: 'flex', justifyContent: 'center' }}
          className="mb-3"
        >
          <div style={{ display: 'flex', width: '80%' }}>
            <div style={{ flex: 1 }}>
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
                style={{ flex: 1 }}
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
              <Title level={2}>Prediction result</Title>
              You have {'aiueo'.includes(disease[0].toLowerCase())
                ? 'an'
                : 'a'}{' '}
              <b>"{disease}"</b>
              <Title level={4} className="mt-4">
                What is {disease}?
              </Title>
              {DISEASE_DESCRIPTIONS[disease as string].description}
              <Title level={4} className="mt-4">
                What might the cause of {disease}?
              </Title>
              <ul>
                {DISEASE_DESCRIPTIONS[disease as string].causes.map(
                  (cause: any) => (
                    <li>{cause}</li>
                  )
                )}
              </ul>
              <Title level={4} className="mt-4">
                What is the treatment for {disease}?
              </Title>
              <ul>
                {DISEASE_DESCRIPTIONS[disease as string].solutions.map(
                  (solution: any) => (
                    <li>{solution}</li>
                  )
                )}
              </ul>
            </div>
          </div>
        )}
      </Box>
    </>
  );
}

export default App;
