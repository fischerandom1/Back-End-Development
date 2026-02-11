@echo off
CALL conda activate fyp_yy
cd C:\Users\Admin\OneDrive\Desktop\3D_detection\OpenPCDet\tools
python demo.py --cfg_file cfgs/kitti_models/pointpillar_custom.yaml --ckpt checkpoint_epoch_700.pth --data_path %1
